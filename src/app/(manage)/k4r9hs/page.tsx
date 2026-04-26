"use client";

import { useState, useMemo } from "react";
import {
  ArrowDownToLine, ArrowUpFromLine, TrendingUp, TrendingDown,
  Coins, ChevronDown, ChevronRight, FileDown,
} from "lucide-react";

// チップの動きカテゴリ
type FlowCategory = "ring" | "baccarat" | "purchase" | "payout" | "prize" | "adjustment";

// direction: "out" = 店から顧客へチップが出る / "in" = 顧客から店にチップが戻る
type Direction = "out" | "in";

interface FlowEntry {
  id: string;
  date: string;        // YYYY-MM-DD
  category: FlowCategory;
  direction: Direction;
  amount: number;      // 枚数(常に正)
  customer?: string;   // 顧客のニックネーム
  table?: string;      // 卓
  staff?: string;
  note?: string;
}

const CATEGORY_LABEL: Record<FlowCategory, string> = {
  ring: "リング",
  baccarat: "バカラ",
  purchase: "チップ購入",
  payout: "精算(現金化)",
  prize: "プライズ付与",
  adjustment: "調整",
};
const CATEGORY_COLOR: Record<FlowCategory, string> = {
  ring: "#3a8f7c",
  baccarat: "#8b5cf6",
  purchase: "#0ea5e9",
  payout: "#f59e0b",
  prize: "#ec4899",
  adjustment: "#6b7280",
};

// デモエントリ(直近30日)
function generateDemoFlows(): FlowEntry[] {
  const flows: FlowEntry[] = [];
  const today = new Date("2026-04-23");
  let id = 1;
  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const d = new Date(today); d.setDate(d.getDate() - dayOffset);
    const dateStr = d.toISOString().split("T")[0];
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const baseCount = isWeekend ? 22 : 14;
    for (let i = 0; i < baseCount; i++) {
      const r = Math.random();
      let cat: FlowCategory;
      if (r < 0.30) cat = "purchase";
      else if (r < 0.55) cat = "ring";
      else if (r < 0.75) cat = "baccarat";
      else if (r < 0.90) cat = "payout";
      else if (r < 0.96) cat = "prize";
      else cat = "adjustment";

      let dir: Direction;
      let amt: number;
      switch (cat) {
        case "purchase":
          // 顧客がチップを買う = 店からチップが出る
          dir = "out"; amt = [1000, 3000, 5000, 10000][Math.floor(Math.random() * 4)]; break;
        case "ring":
        case "baccarat":
          // 勝ち負け両方発生する
          dir = Math.random() < 0.5 ? "out" : "in";
          amt = Math.floor(Math.random() * 8000) + 500; break;
        case "payout":
          // 顧客がチップを返して現金化 = チップが戻る
          dir = "in"; amt = [2000, 5000, 8000, 15000][Math.floor(Math.random() * 4)]; break;
        case "prize":
          dir = "out"; amt = [500, 1000, 2000][Math.floor(Math.random() * 3)]; break;
        case "adjustment":
          dir = Math.random() < 0.5 ? "out" : "in";
          amt = Math.floor(Math.random() * 1000) + 100; break;
      }

      const tables = ["A-1","A-2","A-3","B-1","B-2","VIP-1","VIP-2","BAC-1"];
      const customers = ["タロウ","ハナ","ユウ","ケン","ミィ","ショウ","ダイ","アユ"];
      const staffs = ["山田","鈴木","佐藤","高橋"];

      flows.push({
        id: `f${id++}`,
        date: dateStr,
        category: cat,
        direction: dir,
        amount: amt,
        customer: customers[Math.floor(Math.random() * customers.length)],
        table: cat === "ring" || cat === "baccarat" ? tables[Math.floor(Math.random() * tables.length)] : undefined,
        staff: staffs[Math.floor(Math.random() * staffs.length)],
      });
    }
  }
  return flows;
}

const ALL_FLOWS = generateDemoFlows();

type RangeKey = "7d" | "30d" | "month" | "all";
const RANGE_LABEL: Record<RangeKey, string> = {
  "7d": "直近7日", "30d": "直近30日", "month": "今月", "all": "全期間",
};

export default function ChipFlowPage() {
  const [range, setRange] = useState<RangeKey>("30d");
  const [catFilter, setCatFilter] = useState<"all" | FlowCategory>("all");
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  // 期間フィルタ
  const today = new Date("2026-04-23");
  const filteredByRange = useMemo(() => {
    if (range === "all") return ALL_FLOWS;
    const cutoff = new Date(today);
    if (range === "7d") cutoff.setDate(cutoff.getDate() - 7);
    else if (range === "30d") cutoff.setDate(cutoff.getDate() - 30);
    else if (range === "month") cutoff.setDate(1);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return ALL_FLOWS.filter(f => f.date >= cutoffStr);
  }, [range]);

  const filtered = useMemo(() => {
    return catFilter === "all" ? filteredByRange : filteredByRange.filter(f => f.category === catFilter);
  }, [filteredByRange, catFilter]);

  // 日付ごとに集計
  const dailyAgg = useMemo(() => {
    const map = new Map<string, { date: string; out: number; in: number; entries: FlowEntry[]; byCat: Record<FlowCategory, { out: number; in: number }> }>();
    filtered.forEach(f => {
      if (!map.has(f.date)) {
        map.set(f.date, {
          date: f.date, out: 0, in: 0, entries: [],
          byCat: {
            ring: { out: 0, in: 0 }, baccarat: { out: 0, in: 0 },
            purchase: { out: 0, in: 0 }, payout: { out: 0, in: 0 },
            prize: { out: 0, in: 0 }, adjustment: { out: 0, in: 0 },
          },
        });
      }
      const agg = map.get(f.date)!;
      if (f.direction === "out") {
        agg.out += f.amount;
        agg.byCat[f.category].out += f.amount;
      } else {
        agg.in += f.amount;
        agg.byCat[f.category].in += f.amount;
      }
      agg.entries.push(f);
    });
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [filtered]);

  // 期間総計
  const totalOut = dailyAgg.reduce((s, d) => s + d.out, 0);
  const totalIn = dailyAgg.reduce((s, d) => s + d.in, 0);
  const net = totalIn - totalOut;
  const peak = dailyAgg.reduce((max, d) => (d.out + d.in) > (max.out + max.in) ? d : max, { date: "—", out: 0, in: 0, entries: [], byCat: {} as Record<FlowCategory, { out: number; in: number }> });
  const maxDay = Math.max(...dailyAgg.map(d => Math.max(d.out, d.in)), 1);

  function exportCSV() {
    const header = "日付,出(店→客),戻(客→店),純増減,リング出,リング戻,バカラ出,バカラ戻,購入,精算,プライズ出,調整";
    const rows = dailyAgg.map(d => [
      d.date, d.out, d.in, d.in - d.out,
      d.byCat.ring.out, d.byCat.ring.in,
      d.byCat.baccarat.out, d.byCat.baccarat.in,
      d.byCat.purchase.out, d.byCat.payout.in,
      d.byCat.prize.out,
      d.byCat.adjustment.out + d.byCat.adjustment.in,
    ].join(","));
    const csv = "\ufeff" + [header, ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "chip_flow.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function dateLabel(iso: string): string {
    const d = new Date(iso);
    const dow = ["日","月","火","水","木","金","土"][d.getDay()];
    return `${d.getMonth() + 1}/${d.getDate()}(${dow})`;
  }

  return (
    <div className="page-stack">
      {/* KPI */}
      <section>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="flex items-start gap-10 flex-wrap">
            <KpiItem label="期間内 出ていった" value={totalOut.toLocaleString()} unit="枚" arrowDown danger />
            <KpiItem label="期間内 戻ってきた" value={totalIn.toLocaleString()} unit="枚" arrowUp accent />
            <KpiItem
              label="純増減 (戻−出)"
              value={`${net > 0 ? "+" : ""}${net.toLocaleString()}`}
              unit="枚"
              accent={net >= 0}
              danger={net < 0}
            />
            <KpiItem label="ピーク日" value={peak.date === "—" ? "—" : dateLabel(peak.date)} subText={peak.date === "—" ? "" : `${(peak.out + peak.in).toLocaleString()}枚動いた`} />
          </div>
          <button onClick={exportCSV} className="btn btn-secondary">
            <FileDown className="w-3.5 h-3.5" />CSV出力
          </button>
        </div>
      </section>

      {/* フィルタ */}
      <section>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="tabs">
            {(Object.keys(RANGE_LABEL) as RangeKey[]).map(r => (
              <button key={r} onClick={() => setRange(r)} className={`tab ${range === r ? "tab-active" : ""}`}>
                {RANGE_LABEL[r]}
              </button>
            ))}
          </div>
          <div className="tabs ml-auto">
            <button onClick={() => setCatFilter("all")} className={`tab ${catFilter === "all" ? "tab-active" : ""}`}>すべて</button>
            {(Object.keys(CATEGORY_LABEL) as FlowCategory[]).map(c => (
              <button key={c} onClick={() => setCatFilter(c)} className={`tab ${catFilter === c ? "tab-active" : ""}`}>
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* グラフ(日次バーチャート) */}
      <section className="glass-panel">
        <div className="flex items-center justify-between mb-3">
          <p className="t-label flex items-center gap-1.5"><Coins className="w-4 h-4 text-text-tertiary" />日次フロー</p>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-status-danger" />出(店→客)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-status-success" />戻(客→店)</span>
          </div>
        </div>
        <div className="space-y-1">
          {dailyAgg.length === 0 ? (
            <p className="text-center text-[12px] text-text-tertiary py-8">期間内のチップフローはありません</p>
          ) : dailyAgg.slice().reverse().map(d => {
            const outPct = (d.out / maxDay) * 100;
            const inPct = (d.in / maxDay) * 100;
            const dayNet = d.in - d.out;
            return (
              <div key={d.date} className="flex items-center gap-3 text-[11px]">
                <span className="w-14 flex-shrink-0 text-text-tertiary tabular-nums">{dateLabel(d.date)}</span>
                <div className="flex-1 grid grid-cols-2 gap-1 items-center">
                  {/* 出 (左、左寄せの逆向きバー) */}
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-text-tertiary tabular-nums">{d.out.toLocaleString()}</span>
                    <div className="h-3 bg-status-danger/80 rounded-l-sm" style={{ width: `${outPct}%`, minWidth: d.out > 0 ? 2 : 0 }} />
                  </div>
                  {/* 戻 (右、左寄せ) */}
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 bg-status-success/80 rounded-r-sm" style={{ width: `${inPct}%`, minWidth: d.in > 0 ? 2 : 0 }} />
                    <span className="text-text-tertiary tabular-nums">{d.in.toLocaleString()}</span>
                  </div>
                </div>
                <span className={`w-20 flex-shrink-0 text-right tabular-nums font-semibold ${dayNet > 0 ? "text-status-success" : dayNet < 0 ? "text-status-danger" : "text-text-tertiary"}`}>
                  {dayNet > 0 ? "+" : ""}{dayNet.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 日次テーブル(展開でカテゴリ内訳/エントリ表示) */}
      <section className="glass-panel">
        <p className="t-label mb-3">日次明細</p>
        <table className="data-table">
          <thead>
            <tr>
              <th></th>
              <th>日付</th>
              <th className="text-right">出ていった</th>
              <th className="text-right">戻ってきた</th>
              <th className="text-right">純増減</th>
              <th className="text-right">件数</th>
            </tr>
          </thead>
          <tbody>
            {dailyAgg.length === 0 ? (
              <tr><td colSpan={6} className="!py-10 text-center text-text-tertiary text-[13px]">該当データなし</td></tr>
            ) : dailyAgg.map(d => {
              const expanded = expandedDate === d.date;
              const dayNet = d.in - d.out;
              return (
                <tr key={d.date}>
                  <td colSpan={6} className="!p-0">
                    <button
                      onClick={() => setExpandedDate(expanded ? null : d.date)}
                      className={`w-full grid grid-cols-[28px_120px_1fr_1fr_1fr_60px] gap-3 items-center px-3 py-2.5 text-left hover:bg-white/60 transition-colors ${expanded ? "bg-white/40" : ""}`}
                    >
                      <span className="text-text-tertiary">
                        {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </span>
                      <span className="font-medium text-[13px]">{dateLabel(d.date)}</span>
                      <span className="text-right text-[13px] tabular-nums text-status-danger font-semibold">
                        −{d.out.toLocaleString()}
                      </span>
                      <span className="text-right text-[13px] tabular-nums text-status-success font-semibold">
                        +{d.in.toLocaleString()}
                      </span>
                      <span className={`text-right text-[13px] tabular-nums font-bold ${dayNet > 0 ? "text-status-success" : dayNet < 0 ? "text-status-danger" : "text-text-tertiary"}`}>
                        {dayNet > 0 ? "+" : ""}{dayNet.toLocaleString()}
                      </span>
                      <span className="text-right text-[12px] text-text-tertiary tabular-nums">
                        {d.entries.length}
                      </span>
                    </button>

                    {expanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-border-light bg-white/30 space-y-3">
                        {/* カテゴリ別内訳 */}
                        <div>
                          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">カテゴリ別内訳</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {(Object.keys(CATEGORY_LABEL) as FlowCategory[]).map(c => {
                              const cd = d.byCat[c];
                              if (cd.out === 0 && cd.in === 0) return null;
                              return (
                                <div key={c} className="bg-white rounded-[6px] border border-border-light px-2.5 py-1.5">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLOR[c] }} />
                                    <span className="text-[11px] font-medium">{CATEGORY_LABEL[c]}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-[11px] tabular-nums">
                                    <span className="text-status-danger">−{cd.out.toLocaleString()}</span>
                                    <span className="text-text-tertiary">/</span>
                                    <span className="text-status-success">+{cd.in.toLocaleString()}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* エントリ一覧 */}
                        <div>
                          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">明細 ({d.entries.length}件)</p>
                          <div className="max-h-[280px] overflow-y-auto scrollbar-subtle bg-white rounded-[6px] border border-border-light">
                            <table className="w-full text-[11px]">
                              <thead className="sticky top-0 bg-white border-b border-border-light">
                                <tr>
                                  <th className="px-2 py-1.5 text-left text-text-tertiary font-semibold">区分</th>
                                  <th className="px-2 py-1.5 text-left text-text-tertiary font-semibold">顧客</th>
                                  <th className="px-2 py-1.5 text-left text-text-tertiary font-semibold">卓</th>
                                  <th className="px-2 py-1.5 text-right text-text-tertiary font-semibold">枚数</th>
                                  <th className="px-2 py-1.5 text-left text-text-tertiary font-semibold">担当</th>
                                </tr>
                              </thead>
                              <tbody>
                                {d.entries.map(e => (
                                  <tr key={e.id} className="border-b border-border-light last:border-0 hover:bg-bg-hover">
                                    <td className="px-2 py-1.5">
                                      <span className="inline-flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLOR[e.category] }} />
                                        {CATEGORY_LABEL[e.category]}
                                      </span>
                                    </td>
                                    <td className="px-2 py-1.5">{e.customer || "—"}</td>
                                    <td className="px-2 py-1.5 text-text-tertiary">{e.table || "—"}</td>
                                    <td className={`px-2 py-1.5 text-right tabular-nums font-semibold ${e.direction === "out" ? "text-status-danger" : "text-status-success"}`}>
                                      {e.direction === "out" ? "−" : "+"}{e.amount.toLocaleString()}
                                    </td>
                                    <td className="px-2 py-1.5 text-text-tertiary">{e.staff || "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <p className="t-xs text-text-tertiary">
        ※ 「出」= 店→顧客にチップが流れた量(購入・勝ち・プライズ等)、「戻」= 顧客→店に戻った量(精算・負け等)。
        純増減 = 戻 − 出。プラスなら期間内で店内のチップ在庫が増加。
      </p>
    </div>
  );
}

function KpiItem({ label, value, unit, subText, accent, danger, arrowUp, arrowDown }: {
  label: string; value: string | number; unit?: string; subText?: string;
  accent?: boolean; danger?: boolean; arrowUp?: boolean; arrowDown?: boolean;
}) {
  const color = danger ? "var(--danger-text)" : accent ? "var(--primary-text)" : "var(--text-primary)";
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="t-label flex items-center gap-1">
        {arrowUp && <ArrowUpFromLine className="w-3 h-3 text-status-success" />}
        {arrowDown && <ArrowDownToLine className="w-3 h-3 text-status-danger" />}
        {label}
      </span>
      <span className="flex items-baseline gap-1">
        <span className="t-value" style={{ color }}>{value}</span>
        {unit && <span className="text-[14px] text-text-tertiary">{unit}</span>}
      </span>
      {subText && <span className="t-xs text-text-tertiary">{subText}</span>}
    </div>
  );
}
