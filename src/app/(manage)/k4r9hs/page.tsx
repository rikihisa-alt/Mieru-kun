"use client";

import { useState, useMemo } from "react";
import {
  Coins, ChevronDown, ChevronRight, FileDown,
  Banknote, Ticket, Star, Gift, Trophy, Spade, Diamond, Layers,
} from "lucide-react";

// ===== カテゴリ定義 =====
// 購入系 = 払出のみ / ゲーム系 = 払出(勝ち) + 回収(賭け)
type FlowCategory =
  | "purchase_cash"     // 現金で購入
  | "purchase_multike"  // マルチケで購入
  | "purchase_point"    // ポイントで購入
  | "prize"             // プライズで付与
  | "tournament"        // トーナメント
  | "bj"                // ブラックジャック
  | "baccarat"          // バカラ
  | "ring";             // リング

// direction: "out" = 払出(店→顧客)、"in" = 回収(顧客→店)
type Direction = "out" | "in";

interface FlowEntry {
  id: string;
  date: string;
  category: FlowCategory;
  direction: Direction;
  amount: number;
  customer?: string;
  table?: string;
  staff?: string;
}

const CATEGORY_LABEL: Record<FlowCategory, string> = {
  purchase_cash: "購入(現金)",
  purchase_multike: "マルチケで購入",
  purchase_point: "ポイントで購入",
  prize: "プライズで付与",
  tournament: "トーナメント",
  bj: "ブラックジャック",
  baccarat: "バカラ",
  ring: "リング",
};

const CATEGORY_COLOR: Record<FlowCategory, string> = {
  purchase_cash: "#0ea5e9",
  purchase_multike: "#7c3aed",
  purchase_point: "#f59e0b",
  prize: "#ec4899",
  tournament: "#10b981",
  bj: "#1e293b",
  baccarat: "#8b5cf6",
  ring: "#3a8f7c",
};

const CATEGORY_ICON: Record<FlowCategory, React.ReactNode> = {
  purchase_cash: <Banknote className="w-3.5 h-3.5" strokeWidth={2} />,
  purchase_multike: <Ticket className="w-3.5 h-3.5" strokeWidth={2} />,
  purchase_point: <Star className="w-3.5 h-3.5" strokeWidth={2} />,
  prize: <Gift className="w-3.5 h-3.5" strokeWidth={2} />,
  tournament: <Trophy className="w-3.5 h-3.5" strokeWidth={2} />,
  bj: <Spade className="w-3.5 h-3.5" strokeWidth={2} />,
  baccarat: <Diamond className="w-3.5 h-3.5" strokeWidth={2} />,
  ring: <Layers className="w-3.5 h-3.5" strokeWidth={2} />,
};

// ゲーム系のみ「回収」が発生する
const GAME_CATEGORIES: FlowCategory[] = ["tournament", "bj", "baccarat", "ring"];

// ===== デモデータ生成 =====
function generateDemoFlows(): FlowEntry[] {
  const flows: FlowEntry[] = [];
  const today = new Date("2026-04-23");
  let id = 1;
  const customers = ["タロウ", "ハナ", "ユウ", "ケン", "ミィ", "ショウ", "ダイ", "アユ"];
  const staffs = ["山田", "鈴木", "佐藤", "高橋"];
  const ringTables = ["A-1", "A-2", "A-3", "B-1", "B-2", "VIP-1", "VIP-2"];

  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const d = new Date(today); d.setDate(d.getDate() - dayOffset);
    const dateStr = d.toISOString().split("T")[0];
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const baseCount = isWeekend ? 30 : 20;

    for (let i = 0; i < baseCount; i++) {
      const r = Math.random();
      let cat: FlowCategory;
      if (r < 0.20) cat = "purchase_cash";
      else if (r < 0.26) cat = "purchase_multike";
      else if (r < 0.32) cat = "purchase_point";
      else if (r < 0.38) cat = "prize";
      else if (r < 0.50) cat = "tournament";
      else if (r < 0.62) cat = "bj";
      else if (r < 0.78) cat = "baccarat";
      else cat = "ring";

      const isGame = GAME_CATEGORIES.includes(cat);
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const staff = staffs[Math.floor(Math.random() * staffs.length)];

      if (isGame) {
        // ゲーム系: 賭け(回収) + 結果(払出)を1セットで記録
        const wager = [500, 1000, 2000, 3000, 5000][Math.floor(Math.random() * 5)];
        flows.push({
          id: `f${id++}`,
          date: dateStr, category: cat, direction: "in", amount: wager,
          customer, staff,
          table: cat === "ring" ? ringTables[Math.floor(Math.random() * ringTables.length)] : undefined,
        });
        const winRate = cat === "tournament" ? 0.3 : 0.48; // トナメは勝者少ない
        if (Math.random() < winRate) {
          const payout = Math.round(wager * (cat === "tournament" ? 3 : 1.9));
          flows.push({
            id: `f${id++}`,
            date: dateStr, category: cat, direction: "out", amount: payout,
            customer, staff,
            table: cat === "ring" ? ringTables[Math.floor(Math.random() * ringTables.length)] : undefined,
          });
        }
      } else {
        // 購入系・プライズ: 払出のみ
        let amt: number;
        switch (cat) {
          case "purchase_cash": amt = [1000, 3000, 5000, 10000, 20000][Math.floor(Math.random() * 5)]; break;
          case "purchase_multike": amt = [500, 1000, 2000][Math.floor(Math.random() * 3)]; break;
          case "purchase_point": amt = [300, 500, 1000][Math.floor(Math.random() * 3)]; break;
          case "prize": amt = [500, 1000, 2000][Math.floor(Math.random() * 3)]; break;
          default: amt = 1000;
        }
        flows.push({
          id: `f${id++}`,
          date: dateStr, category: cat, direction: "out", amount: amt,
          customer, staff,
        });
      }
    }
  }
  return flows;
}

const ALL_FLOWS = generateDemoFlows();

// ===== 期間 =====
type RangeKey = "7d" | "30d" | "month" | "all";
const RANGE_LABEL: Record<RangeKey, string> = {
  "7d": "直近7日", "30d": "直近30日", "month": "今月", "all": "全期間",
};

export default function ChipFlowPage() {
  const [range, setRange] = useState<RangeKey>("30d");
  const [catFilter, setCatFilter] = useState<"all" | FlowCategory>("all");
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

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

  // 日付ごと集計
  const dailyAgg = useMemo(() => {
    const map = new Map<string, {
      date: string; out: number; in: number; entries: FlowEntry[];
      byCat: Record<FlowCategory, { out: number; in: number }>;
    }>();
    filtered.forEach(f => {
      if (!map.has(f.date)) {
        const init: Record<FlowCategory, { out: number; in: number }> = {
          purchase_cash: { out: 0, in: 0 },
          purchase_multike: { out: 0, in: 0 },
          purchase_point: { out: 0, in: 0 },
          prize: { out: 0, in: 0 },
          tournament: { out: 0, in: 0 },
          bj: { out: 0, in: 0 },
          baccarat: { out: 0, in: 0 },
          ring: { out: 0, in: 0 },
        };
        map.set(f.date, { date: f.date, out: 0, in: 0, entries: [], byCat: init });
      }
      const agg = map.get(f.date)!;
      if (f.direction === "out") { agg.out += f.amount; agg.byCat[f.category].out += f.amount; }
      else { agg.in += f.amount; agg.byCat[f.category].in += f.amount; }
      agg.entries.push(f);
    });
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [filtered]);

  // カテゴリ別集計(期間トータル)
  const catTotals = useMemo(() => {
    const totals: Record<FlowCategory, { out: number; in: number }> = {
      purchase_cash: { out: 0, in: 0 },
      purchase_multike: { out: 0, in: 0 },
      purchase_point: { out: 0, in: 0 },
      prize: { out: 0, in: 0 },
      tournament: { out: 0, in: 0 },
      bj: { out: 0, in: 0 },
      baccarat: { out: 0, in: 0 },
      ring: { out: 0, in: 0 },
    };
    filteredByRange.forEach(f => {
      if (f.direction === "out") totals[f.category].out += f.amount;
      else totals[f.category].in += f.amount;
    });
    return totals;
  }, [filteredByRange]);

  const totalOut = dailyAgg.reduce((s, d) => s + d.out, 0);
  const totalIn = dailyAgg.reduce((s, d) => s + d.in, 0);
  const netOut = totalOut - totalIn; // 店からの正味流出
  const peak = dailyAgg.reduce((max, d) => (d.out + d.in) > (max.out + max.in) ? d : max,
    { date: "—", out: 0, in: 0, entries: [], byCat: {} as Record<FlowCategory, { out: number; in: number }> });
  const maxDay = Math.max(...dailyAgg.map(d => Math.max(d.out, d.in)), 1);

  function exportCSV() {
    const cols = (Object.keys(CATEGORY_LABEL) as FlowCategory[]);
    const header = ["日付", "払出計", "回収計", "純払出", ...cols.flatMap(c => [`${CATEGORY_LABEL[c]}-払出`, `${CATEGORY_LABEL[c]}-回収`])].join(",");
    const rows = dailyAgg.map(d => [
      d.date, d.out, d.in, d.out - d.in,
      ...cols.flatMap(c => [d.byCat[c].out, d.byCat[c].in]),
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
    const dow = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
    return `${d.getMonth() + 1}/${d.getDate()}(${dow})`;
  }

  return (
    <div className="page-stack">
      {/* KPI */}
      <section>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="flex items-start gap-10 flex-wrap">
            <KpiItem label="期間内 払出" value={totalOut.toLocaleString()} unit="枚" danger />
            <KpiItem label="期間内 回収" value={totalIn.toLocaleString()} unit="枚" accent />
            <KpiItem
              label="純払出 (払出−回収)"
              value={`${netOut > 0 ? "+" : ""}${netOut.toLocaleString()}`}
              unit="枚"
              danger={netOut > 0}
              accent={netOut <= 0}
              subText={netOut > 0 ? "店内チップが減少" : "店内チップが増加"}
            />
            <KpiItem
              label="ピーク日"
              value={peak.date === "—" ? "—" : dateLabel(peak.date)}
              subText={peak.date === "—" ? "" : `${(peak.out + peak.in).toLocaleString()}枚動いた`}
            />
          </div>
          <button onClick={exportCSV} className="btn btn-secondary">
            <FileDown className="w-3.5 h-3.5" />CSV出力
          </button>
        </div>
      </section>

      {/* 期間 + カテゴリフィルタ */}
      <section>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="tabs">
            {(Object.keys(RANGE_LABEL) as RangeKey[]).map(r => (
              <button key={r} onClick={() => setRange(r)} className={`tab ${range === r ? "tab-active" : ""}`}>
                {RANGE_LABEL[r]}
              </button>
            ))}
          </div>
          <div className="tabs ml-auto flex-wrap">
            <button onClick={() => setCatFilter("all")} className={`tab ${catFilter === "all" ? "tab-active" : ""}`}>すべて</button>
            {(Object.keys(CATEGORY_LABEL) as FlowCategory[]).map(c => (
              <button key={c} onClick={() => setCatFilter(c)} className={`tab ${catFilter === c ? "tab-active" : ""}`}>
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* カテゴリ別サマリ */}
      <section className="glass-panel">
        <p className="t-label mb-4">カテゴリ別集計（{RANGE_LABEL[range]}）</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.keys(CATEGORY_LABEL) as FlowCategory[]).map(c => {
            const t = catTotals[c];
            const isGame = GAME_CATEGORIES.includes(c);
            const cnet = t.out - t.in;
            const color = CATEGORY_COLOR[c];
            return (
              <div
                key={c}
                className="relative rounded-[var(--radius)] p-3.5 transition-all hover:-translate-y-0.5"
                style={{
                  background: "rgba(255,255,255,0.55)",
                  backdropFilter: "blur(10px) saturate(140%)",
                  WebkitBackdropFilter: "blur(10px) saturate(140%)",
                  border: "1px solid rgba(255,255,255,0.65)",
                  boxShadow: "0 1px 2px rgba(28,46,60,0.04), 0 4px 12px -4px rgba(28,46,60,0.06)",
                }}
              >
                {/* 左サイドのカラーアクセント(うっすら) */}
                <span
                  className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
                  style={{ background: `${color}55` }}
                />

                <div className="flex items-center gap-2 mb-2.5">
                  <span
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center"
                    style={{
                      background: `${color}1a`,
                      color,
                      border: `1px solid ${color}26`,
                    }}
                  >
                    {CATEGORY_ICON[c]}
                  </span>
                  <span className="text-[12px] font-semibold text-text-primary truncate tracking-tight">{CATEGORY_LABEL[c]}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">払出</span>
                    <span className="text-[14px] font-semibold tabular-nums text-text-primary">{t.out.toLocaleString()}</span>
                  </div>
                  {isGame && (
                    <>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">回収</span>
                        <span className="text-[14px] font-semibold tabular-nums text-text-primary">{t.in.toLocaleString()}</span>
                      </div>
                      <div className="flex items-baseline justify-between pt-1.5 mt-1 border-t" style={{ borderColor: "rgba(28,46,60,0.06)" }}>
                        <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">店収支</span>
                        <span
                          className="text-[13px] font-bold tabular-nums"
                          style={{ color: cnet > 0 ? "var(--danger-text)" : "var(--primary-text)" }}
                        >
                          {cnet > 0 ? "−" : "+"}{Math.abs(cnet).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 日次双方向グラフ */}
      <section className="glass-panel">
        <div className="flex items-center justify-between mb-3">
          <p className="t-label flex items-center gap-1.5"><Coins className="w-4 h-4 text-text-tertiary" />日次フロー</p>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-status-danger" />払出</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-status-success" />回収</span>
          </div>
        </div>
        <div className="space-y-1">
          {dailyAgg.length === 0 ? (
            <p className="text-center text-[12px] text-text-tertiary py-8">期間内のチップフローはありません</p>
          ) : dailyAgg.slice().reverse().map(d => {
            const outPct = (d.out / maxDay) * 100;
            const inPct = (d.in / maxDay) * 100;
            const dayNet = d.out - d.in;
            return (
              <div key={d.date} className="flex items-center gap-3 text-[11px]">
                <span className="w-14 flex-shrink-0 text-text-tertiary tabular-nums">{dateLabel(d.date)}</span>
                <div className="flex-1 grid grid-cols-2 gap-1 items-center">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-text-tertiary tabular-nums">{d.out.toLocaleString()}</span>
                    <div className="h-3 bg-status-danger/80 rounded-l-sm" style={{ width: `${outPct}%`, minWidth: d.out > 0 ? 2 : 0 }} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 bg-status-success/80 rounded-r-sm" style={{ width: `${inPct}%`, minWidth: d.in > 0 ? 2 : 0 }} />
                    <span className="text-text-tertiary tabular-nums">{d.in.toLocaleString()}</span>
                  </div>
                </div>
                <span className={`w-20 flex-shrink-0 text-right tabular-nums font-semibold ${dayNet > 0 ? "text-status-danger" : dayNet < 0 ? "text-status-success" : "text-text-tertiary"}`}>
                  {dayNet > 0 ? "−" : dayNet < 0 ? "+" : ""}{Math.abs(dayNet).toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 日次明細(展開) */}
      <section className="glass-panel">
        <p className="t-label mb-3">日次明細</p>
        <table className="data-table">
          <thead>
            <tr>
              <th></th>
              <th>日付</th>
              <th className="text-right">払出</th>
              <th className="text-right">回収</th>
              <th className="text-right">純払出</th>
              <th className="text-right">件数</th>
            </tr>
          </thead>
          <tbody>
            {dailyAgg.length === 0 ? (
              <tr><td colSpan={6} className="!py-10 text-center text-text-tertiary text-[13px]">該当データなし</td></tr>
            ) : dailyAgg.map(d => {
              const expanded = expandedDate === d.date;
              const dayNet = d.out - d.in;
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
                      <span className={`text-right text-[13px] tabular-nums font-bold ${dayNet > 0 ? "text-status-danger" : dayNet < 0 ? "text-status-success" : "text-text-tertiary"}`}>
                        {dayNet > 0 ? "−" : dayNet < 0 ? "+" : ""}{Math.abs(dayNet).toLocaleString()}
                      </span>
                      <span className="text-right text-[12px] text-text-tertiary tabular-nums">
                        {d.entries.length}
                      </span>
                    </button>

                    {expanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-border-light bg-white/30 space-y-3">
                        <div>
                          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">カテゴリ別内訳</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {(Object.keys(CATEGORY_LABEL) as FlowCategory[]).map(c => {
                              const cd = d.byCat[c];
                              if (cd.out === 0 && cd.in === 0) return null;
                              const isGame = GAME_CATEGORIES.includes(c);
                              const color = CATEGORY_COLOR[c];
                              return (
                                <div
                                  key={c}
                                  className="relative rounded-[var(--radius-sm)] px-2.5 py-2"
                                  style={{
                                    background: "rgba(255,255,255,0.6)",
                                    backdropFilter: "blur(8px)",
                                    border: "1px solid rgba(255,255,255,0.7)",
                                    boxShadow: "0 1px 1px rgba(28,46,60,0.03)",
                                  }}
                                >
                                  <span
                                    className="absolute left-0 top-2 bottom-2 w-[2px] rounded-r-full"
                                    style={{ background: `${color}55` }}
                                  />
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span
                                      className="w-4 h-4 rounded-[4px] flex items-center justify-center"
                                      style={{ background: `${color}1a`, color, border: `1px solid ${color}26` }}
                                    >
                                      <span className="[&>svg]:w-2.5 [&>svg]:h-2.5">{CATEGORY_ICON[c]}</span>
                                    </span>
                                    <span className="text-[11px] font-semibold truncate">{CATEGORY_LABEL[c]}</span>
                                  </div>
                                  <div className="text-[11px] tabular-nums space-y-0.5">
                                    <div className="flex justify-between"><span className="text-text-tertiary">払出</span><span className="font-semibold">{cd.out.toLocaleString()}</span></div>
                                    {isGame && <div className="flex justify-between"><span className="text-text-tertiary">回収</span><span className="font-semibold">{cd.in.toLocaleString()}</span></div>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">明細 ({d.entries.length}件)</p>
                          <div className="max-h-[280px] overflow-y-auto scrollbar-subtle bg-white rounded-[6px] border border-border-light">
                            <table className="w-full text-[11px]">
                              <thead className="sticky top-0 bg-white border-b border-border-light">
                                <tr>
                                  <th className="px-2 py-1.5 text-left text-text-tertiary font-semibold">区分</th>
                                  <th className="px-2 py-1.5 text-left text-text-tertiary font-semibold">向き</th>
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
                                    <td className="px-2 py-1.5">
                                      <span className={`text-[10px] font-medium ${e.direction === "out" ? "text-status-danger" : "text-status-success"}`}>
                                        {e.direction === "out" ? "払出" : "回収"}
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

      <p className="t-xs text-text-tertiary leading-[1.7]">
        ※ 「払出」= 店から顧客にチップが渡る量(購入・プライズ・ゲームでの勝ち)。
        「回収」= 顧客から店にチップが戻る量(ゲームでの賭け額)。
        ゲーム系(トナメ/BJ/バカラ/リング)は同じ卓内で払出と回収が両方発生し、差分が店の収支になります。
      </p>
    </div>
  );
}

function KpiItem({ label, value, unit, subText, accent, danger }: {
  label: string; value: string | number; unit?: string; subText?: string;
  accent?: boolean; danger?: boolean;
}) {
  const color = danger ? "var(--danger-text)" : accent ? "var(--primary-text)" : "var(--text-primary)";
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="t-label">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className="t-value" style={{ color }}>{value}</span>
        {unit && <span className="text-[14px] text-text-tertiary">{unit}</span>}
      </span>
      {subText && <span className="t-xs text-text-tertiary">{subText}</span>}
    </div>
  );
}
