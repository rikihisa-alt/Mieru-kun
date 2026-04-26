"use client";

import { useState, useMemo, useEffect } from "react";
import {
  FileDown, X, ArrowUpRight, ArrowDownRight, AlertTriangle, Sparkles,
  Banknote, Ticket, Star, Gift, Trophy, Spade, Diamond, Layers,
} from "lucide-react";

// ===== カテゴリ定義 =====
type FlowCategory =
  | "purchase_cash" | "purchase_multike" | "purchase_point" | "prize"
  | "tournament" | "bj" | "baccarat" | "ring";

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
const CATEGORY_SHORT: Record<FlowCategory, string> = {
  purchase_cash: "購入",
  purchase_multike: "マルチケ",
  purchase_point: "ポイント",
  prize: "プライズ",
  tournament: "トナメ",
  bj: "BJ",
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
  purchase_cash: <Banknote className="w-3.5 h-3.5" strokeWidth={1.8} />,
  purchase_multike: <Ticket className="w-3.5 h-3.5" strokeWidth={1.8} />,
  purchase_point: <Star className="w-3.5 h-3.5" strokeWidth={1.8} />,
  prize: <Gift className="w-3.5 h-3.5" strokeWidth={1.8} />,
  tournament: <Trophy className="w-3.5 h-3.5" strokeWidth={1.8} />,
  bj: <Spade className="w-3.5 h-3.5" strokeWidth={1.8} />,
  baccarat: <Diamond className="w-3.5 h-3.5" strokeWidth={1.8} />,
  ring: <Layers className="w-3.5 h-3.5" strokeWidth={1.8} />,
};
const GAME_CATEGORIES: FlowCategory[] = ["tournament", "bj", "baccarat", "ring"];
const ALL_CATEGORIES = Object.keys(CATEGORY_LABEL) as FlowCategory[];

// ===== デモデータ生成 (60日分: 前期間比較ができるように) =====
function generateDemoFlows(): FlowEntry[] {
  const flows: FlowEntry[] = [];
  const today = new Date("2026-04-23");
  let id = 1;
  const customers = ["タロウ", "ハナ", "ユウ", "ケン", "ミィ", "ショウ", "ダイ", "アユ"];
  const staffs = ["山田", "鈴木", "佐藤", "高橋"];
  const ringTables = ["A-1", "A-2", "A-3", "B-1", "B-2", "VIP-1", "VIP-2"];

  for (let dayOffset = 59; dayOffset >= 0; dayOffset--) {
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
        const wager = [500, 1000, 2000, 3000, 5000][Math.floor(Math.random() * 5)];
        flows.push({
          id: `f${id++}`, date: dateStr, category: cat, direction: "in", amount: wager,
          customer, staff,
          table: cat === "ring" ? ringTables[Math.floor(Math.random() * ringTables.length)] : undefined,
        });
        const winRate = cat === "tournament" ? 0.3 : 0.48;
        if (Math.random() < winRate) {
          const payout = Math.round(wager * (cat === "tournament" ? 3 : 1.9));
          flows.push({
            id: `f${id++}`, date: dateStr, category: cat, direction: "out", amount: payout,
            customer, staff,
            table: cat === "ring" ? ringTables[Math.floor(Math.random() * ringTables.length)] : undefined,
          });
        }
      } else {
        let amt = 1000;
        switch (cat) {
          case "purchase_cash": amt = [1000, 3000, 5000, 10000, 20000][Math.floor(Math.random() * 5)]; break;
          case "purchase_multike": amt = [500, 1000, 2000][Math.floor(Math.random() * 3)]; break;
          case "purchase_point": amt = [300, 500, 1000][Math.floor(Math.random() * 3)]; break;
          case "prize": amt = [500, 1000, 2000][Math.floor(Math.random() * 3)]; break;
        }
        flows.push({ id: `f${id++}`, date: dateStr, category: cat, direction: "out", amount: amt, customer, staff });
      }
    }
  }
  return flows;
}

const ALL_FLOWS = generateDemoFlows();

// ===== 期間 =====
type RangeKey = "7d" | "30d" | "month" | "all";
const RANGE_LABEL: Record<RangeKey, string> = {
  "7d": "7日", "30d": "30日", "month": "今月", "all": "全期間",
};
function rangeDays(r: RangeKey, today: Date): { from: string; days: number } {
  if (r === "all") return { from: "0000-00-00", days: 9999 };
  const d = new Date(today);
  let n = 30;
  if (r === "7d") n = 7;
  else if (r === "30d") n = 30;
  else if (r === "month") { d.setDate(1); return { from: d.toISOString().split("T")[0], days: 31 }; }
  d.setDate(d.getDate() - n);
  return { from: d.toISOString().split("T")[0], days: n };
}

// ===== 集計 =====
function aggregate(flows: FlowEntry[]) {
  const byDate = new Map<string, {
    date: string; out: number; in: number;
    byCat: Record<FlowCategory, { out: number; in: number }>;
    entries: FlowEntry[];
  }>();
  const byCat: Record<FlowCategory, { out: number; in: number }> = {
    purchase_cash: { out: 0, in: 0 }, purchase_multike: { out: 0, in: 0 },
    purchase_point: { out: 0, in: 0 }, prize: { out: 0, in: 0 },
    tournament: { out: 0, in: 0 }, bj: { out: 0, in: 0 },
    baccarat: { out: 0, in: 0 }, ring: { out: 0, in: 0 },
  };

  flows.forEach(f => {
    if (!byDate.has(f.date)) {
      byDate.set(f.date, {
        date: f.date, out: 0, in: 0,
        byCat: {
          purchase_cash: { out: 0, in: 0 }, purchase_multike: { out: 0, in: 0 },
          purchase_point: { out: 0, in: 0 }, prize: { out: 0, in: 0 },
          tournament: { out: 0, in: 0 }, bj: { out: 0, in: 0 },
          baccarat: { out: 0, in: 0 }, ring: { out: 0, in: 0 },
        },
        entries: [],
      });
    }
    const day = byDate.get(f.date)!;
    if (f.direction === "out") {
      day.out += f.amount; day.byCat[f.category].out += f.amount; byCat[f.category].out += f.amount;
    } else {
      day.in += f.amount; day.byCat[f.category].in += f.amount; byCat[f.category].in += f.amount;
    }
    day.entries.push(f);
  });

  const totalOut = Object.values(byCat).reduce((s, v) => s + v.out, 0);
  const totalIn = Object.values(byCat).reduce((s, v) => s + v.in, 0);
  return {
    days: Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date)),
    byCat, totalOut, totalIn,
    profit: totalIn - totalOut,
  };
}

function dateLabel(iso: string, withDow = true): string {
  const d = new Date(iso);
  const dow = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return withDow ? `${d.getMonth() + 1}/${d.getDate()}(${dow})` : `${d.getMonth() + 1}/${d.getDate()}`;
}

// ============================================================
// PAGE
// ============================================================
export default function ChipFlowPage() {
  const [range, setRange] = useState<RangeKey>("30d");
  const [drawer, setDrawer] = useState<
    | { kind: "category"; category: FlowCategory }
    | { kind: "day"; date: string }
    | null
  >(null);

  const today = new Date("2026-04-23");

  // 当期/前期 集計
  const { current, previous } = useMemo(() => {
    const cur = rangeDays(range, today);
    const curFlows = ALL_FLOWS.filter(f => f.date >= cur.from);
    let prevFlows: FlowEntry[] = [];
    if (range !== "all") {
      const prevTo = cur.from;
      const prevFrom = new Date(prevTo); prevFrom.setDate(prevFrom.getDate() - cur.days);
      const prevFromStr = prevFrom.toISOString().split("T")[0];
      prevFlows = ALL_FLOWS.filter(f => f.date >= prevFromStr && f.date < prevTo);
    }
    return { current: aggregate(curFlows), previous: aggregate(prevFlows) };
  }, [range]);

  // ヒーロー指標
  const profit = current.profit; // 戻 - 出 = 店から見た純利益(回収側 - 払出側)
  const profitDelta = previous.profit !== 0 ? ((profit - previous.profit) / Math.abs(previous.profit)) * 100 : null;

  // カテゴリランキング(利益順、ゲーム系のみ)
  const ranked = useMemo(() => {
    return ALL_CATEGORIES.map(c => {
      const t = current.byCat[c];
      const profit = t.in - t.out; // ゲーム系: 回収-払出 = ハウス利益 / 購入系: -(出のみ) でマイナスになる
      const total = t.in + t.out;
      const rate = t.in > 0 ? (profit / t.in) * 100 : 0;
      return { category: c, ...t, profit, total, rate };
    }).sort((a, b) => b.profit - a.profit);
  }, [current]);

  const topCategory = ranked.find(r => GAME_CATEGORIES.includes(r.category) && r.profit > 0);

  // 異常検知 (簡易ヒューリスティック)
  const insights = useMemo(() => generateInsights(current, previous, range), [current, previous, range]);

  function exportCSV() {
    const cols = ALL_CATEGORIES;
    const header = ["日付", "払出計", "回収計", "純利益", ...cols.flatMap(c => [`${CATEGORY_LABEL[c]}-払出`, `${CATEGORY_LABEL[c]}-回収`])].join(",");
    const rows = current.days.slice().reverse().map(d => [
      d.date, d.out, d.in, d.in - d.out,
      ...cols.flatMap(c => [d.byCat[c].out, d.byCat[c].in]),
    ].join(","));
    const csv = "\ufeff" + [header, ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `chip_flow_${range}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-7">
      {/* ===== ① HERO STRIP ===== */}
      <section className="border-b border-[rgba(28,46,60,0.08)] pb-5">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="flex items-end gap-12 flex-wrap">
            {/* 純利益 (主役) */}
            <button
              onClick={() => setDrawer({ kind: "category", category: topCategory?.category ?? "ring" })}
              className="flex flex-col items-start text-left hover:opacity-80 transition-opacity"
            >
              <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-[0.18em]">
                純利益 {RANGE_LABEL[range]}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className="text-[40px] font-bold tabular-nums leading-none tracking-tight"
                  style={{ color: profit >= 0 ? "#0e7a55" : "#a4291f" }}
                >
                  {profit >= 0 ? "+" : "−"}¥{Math.abs(profit).toLocaleString()}
                </span>
                {profitDelta != null && (
                  <span className={`flex items-center gap-0.5 text-[12px] font-semibold ${profitDelta >= 0 ? "text-[#0e7a55]" : "text-[#a4291f]"}`}>
                    {profitDelta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {profitDelta >= 0 ? "+" : ""}{profitDelta.toFixed(1)}%
                  </span>
                )}
              </div>
              <span className="text-[10px] text-text-tertiary mt-1">前{RANGE_LABEL[range]}比 · クリックで主因詳細</span>
            </button>

            {/* サブKPI: 縦線で区切る */}
            <div className="flex items-end gap-8">
              <SubKpi label="総払出" value={current.totalOut} />
              <SubKpi label="総回収" value={current.totalIn} />
              <SubKpi
                label="最大利益源"
                valueLabel={topCategory ? CATEGORY_LABEL[topCategory.category] : "—"}
                subLabel={topCategory ? `+¥${topCategory.profit.toLocaleString()}` : ""}
                onClick={topCategory ? () => setDrawer({ kind: "category", category: topCategory.category }) : undefined}
              />
            </div>
          </div>

          {/* 期間タブ + CSV */}
          <div className="flex items-center gap-2">
            <div className="flex border border-[rgba(28,46,60,0.10)] rounded-[6px] overflow-hidden">
              {(Object.keys(RANGE_LABEL) as RangeKey[]).map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    range === r ? "bg-text-primary text-white" : "bg-white text-text-secondary hover:bg-bg-hover"
                  }`}
                >
                  {RANGE_LABEL[r]}
                </button>
              ))}
            </div>
            <button onClick={exportCSV} className="px-3 py-1.5 text-[12px] font-medium border border-[rgba(28,46,60,0.10)] rounded-[6px] hover:bg-bg-hover flex items-center gap-1">
              <FileDown className="w-3 h-3" />CSV
            </button>
          </div>
        </div>
      </section>

      {/* ===== ② INSIGHT STRIP ===== */}
      {insights.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3 h-3 text-text-tertiary" />
            <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-[0.18em]">
              ハイライト
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[rgba(28,46,60,0.08)] border border-[rgba(28,46,60,0.08)] rounded-[6px] overflow-hidden">
            {insights.map((ins, i) => (
              <button
                key={i}
                onClick={ins.onClick}
                className="bg-white px-4 py-3 text-left hover:bg-bg-hover transition-colors"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  {ins.severity === "warning" ? (
                    <AlertTriangle className="w-3 h-3 text-[#c87b1a]" />
                  ) : ins.severity === "danger" ? (
                    <AlertTriangle className="w-3 h-3 text-[#a4291f]" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-[#0e7a55]" />
                  )}
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">{ins.label}</span>
                </div>
                <p className="text-[13px] font-medium text-text-primary leading-snug">{ins.text}</p>
                {ins.value != null && (
                  <p className={`text-[12px] font-semibold mt-0.5 tabular-nums ${ins.value >= 0 ? "text-[#0e7a55]" : "text-[#a4291f]"}`}>
                    {ins.value >= 0 ? "+" : ""}{ins.formatted ?? ins.value.toLocaleString()}
                  </p>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ===== ③ CATEGORY RANKING ===== */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-[14px] font-semibold text-text-primary tracking-tight">カテゴリ別ランキング</h2>
          <span className="text-[11px] text-text-tertiary">利益順 · 行クリックで詳細</span>
        </div>
        <div className="border border-[rgba(28,46,60,0.08)] rounded-[8px] overflow-hidden bg-white">
          {/* ヘッダー */}
          <div className="grid grid-cols-[36px_1fr_120px_120px_140px_90px_180px] items-center px-4 py-2.5 border-b border-[rgba(28,46,60,0.08)] bg-[#fafafa] text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
            <span>#</span>
            <span>カテゴリ</span>
            <span className="text-right">払出</span>
            <span className="text-right">回収</span>
            <span className="text-right">利益</span>
            <span className="text-right">利益率</span>
            <span></span>
          </div>
          {/* 行 */}
          {ranked.map((r, i) => {
            const isGame = GAME_CATEGORIES.includes(r.category);
            const maxProfit = Math.max(...ranked.map(x => Math.abs(x.profit)), 1);
            const barPct = (Math.abs(r.profit) / maxProfit) * 100;
            const positive = r.profit >= 0;
            return (
              <button
                key={r.category}
                onClick={() => setDrawer({ kind: "category", category: r.category })}
                className="w-full grid grid-cols-[36px_1fr_120px_120px_140px_90px_180px] items-center px-4 py-3 border-b border-[rgba(28,46,60,0.06)] last:border-b-0 hover:bg-[#fafafa] transition-colors text-left"
              >
                <span className={`text-[12px] font-mono ${i < 3 ? "font-bold text-text-primary" : "text-text-tertiary"}`}>
                  {i + 1}
                </span>
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-5 h-5 rounded-[4px] flex items-center justify-center flex-shrink-0"
                    style={{ background: `${CATEGORY_COLOR[r.category]}14`, color: CATEGORY_COLOR[r.category] }}
                  >
                    {CATEGORY_ICON[r.category]}
                  </span>
                  <span className="text-[13px] font-medium text-text-primary truncate">{CATEGORY_LABEL[r.category]}</span>
                  {!isGame && <span className="text-[10px] text-text-tertiary">(払出のみ)</span>}
                </span>
                <span className="text-right text-[13px] tabular-nums text-text-primary">{r.out.toLocaleString()}</span>
                <span className="text-right text-[13px] tabular-nums text-text-primary">{isGame ? r.in.toLocaleString() : "—"}</span>
                <span
                  className="text-right text-[14px] font-semibold tabular-nums"
                  style={{ color: positive ? "#0e7a55" : "#a4291f" }}
                >
                  {positive ? "+" : "−"}¥{Math.abs(r.profit).toLocaleString()}
                </span>
                <span className="text-right text-[12px] tabular-nums text-text-secondary">
                  {isGame && r.in > 0 ? `${r.rate.toFixed(1)}%` : "—"}
                </span>
                {/* ミニバー */}
                <span className="flex items-center justify-end pl-3">
                  <span className="relative flex-1 h-1.5 bg-[rgba(28,46,60,0.05)] rounded-full overflow-hidden max-w-[160px]">
                    <span
                      className="absolute top-0 left-0 h-full rounded-full"
                      style={{
                        width: `${barPct}%`,
                        background: positive ? "#0e7a55" : "#a4291f",
                      }}
                    />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ===== ④ DAILY FLOW (主役チャート) ===== */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-[14px] font-semibold text-text-primary tracking-tight">日次フロー</h2>
          <div className="flex items-center gap-3 text-[11px] text-text-tertiary">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#a4291f" }} />払出</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#0e7a55" }} />回収</span>
            <span className="text-text-tertiary">バークリックでその日の明細</span>
          </div>
        </div>
        <DailyFlowChart days={current.days} onDayClick={(d) => setDrawer({ kind: "day", date: d })} />
      </section>

      {/* ===== DRAWER ===== */}
      {drawer && (
        <DetailDrawer onClose={() => setDrawer(null)} title={drawer.kind === "category" ? CATEGORY_LABEL[drawer.category] : dateLabel(drawer.date)}>
          {drawer.kind === "category" ? (
            <CategoryDetail category={drawer.category} current={current} previous={previous} range={range} />
          ) : (
            <DayDetail date={drawer.date} day={current.days.find(d => d.date === drawer.date)} />
          )}
        </DetailDrawer>
      )}
    </div>
  );
}

// ============================================================
// SUB COMPONENTS
// ============================================================

function SubKpi({ label, value, valueLabel, subLabel, onClick }: {
  label: string; value?: number; valueLabel?: string; subLabel?: string; onClick?: () => void;
}) {
  const inner = (
    <div className="flex flex-col items-start text-left">
      <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-[0.16em]">{label}</span>
      <span className="text-[20px] font-semibold tabular-nums text-text-primary mt-1 leading-none tracking-tight">
        {value != null ? `¥${value.toLocaleString()}` : valueLabel}
      </span>
      {subLabel && <span className="text-[11px] text-[#0e7a55] mt-1 font-semibold tabular-nums">{subLabel}</span>}
    </div>
  );
  return onClick ? (
    <button onClick={onClick} className="border-l border-[rgba(28,46,60,0.08)] pl-8 hover:opacity-80 transition-opacity">{inner}</button>
  ) : (
    <div className="border-l border-[rgba(28,46,60,0.08)] pl-8">{inner}</div>
  );
}

function DailyFlowChart({ days, onDayClick }: {
  days: { date: string; out: number; in: number }[];
  onDayClick: (date: string) => void;
}) {
  if (days.length === 0) {
    return <div className="border border-[rgba(28,46,60,0.08)] rounded-[8px] py-12 text-center text-[12px] text-text-tertiary">期間内のデータがありません</div>;
  }
  const maxAbs = Math.max(...days.map(d => Math.max(d.out, d.in)), 1);
  return (
    <div className="border border-[rgba(28,46,60,0.08)] rounded-[8px] bg-white py-4 px-2">
      <div className="grid items-end gap-px" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)`, height: 220 }}>
        {days.map(d => {
          const outH = (d.out / maxAbs) * 90;
          const inH = (d.in / maxAbs) * 90;
          const net = d.in - d.out;
          return (
            <button
              key={d.date}
              onClick={() => onDayClick(d.date)}
              title={`${dateLabel(d.date)} 純利益 ${net >= 0 ? "+" : ""}${net.toLocaleString()}`}
              className="group relative h-full flex flex-col items-center justify-end gap-px hover:bg-[#fafafa] rounded-[2px] py-1 transition-colors"
            >
              {/* 上バー: 回収 (緑) */}
              <div className="w-full flex flex-col justify-end" style={{ height: `${inH}%` }}>
                <div className="w-[70%] mx-auto h-full rounded-t-[2px]" style={{ background: "#0e7a55", opacity: 0.85 }} />
              </div>
              {/* 中央線(0) */}
              <div className="w-full h-px" style={{ background: "rgba(28,46,60,0.15)" }} />
              {/* 下バー: 払出 (赤) */}
              <div className="w-full" style={{ height: `${outH}%` }}>
                <div className="w-[70%] mx-auto h-full rounded-b-[2px]" style={{ background: "#a4291f", opacity: 0.85 }} />
              </div>
            </button>
          );
        })}
      </div>
      {/* 日付軸(間引き) */}
      <div className="grid mt-2" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
        {days.map((d, i) => {
          const showLabel = days.length <= 14 || i % Math.ceil(days.length / 10) === 0 || i === days.length - 1;
          return (
            <span key={d.date} className="text-[9px] text-text-tertiary text-center tabular-nums">
              {showLabel ? dateLabel(d.date, false) : ""}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ===== ドロワー =====
function DetailDrawer({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button onClick={onClose} className="absolute inset-0 bg-text-primary/30 backdrop-blur-[2px]" aria-label="close" />
      <div className="relative w-full max-w-[520px] h-full bg-white border-l border-[rgba(28,46,60,0.08)] shadow-2xl flex flex-col animate-[slideIn_0.22s_cubic-bezier(0.22,0.61,0.36,1)]">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(28,46,60,0.08)]">
          <h3 className="text-[14px] font-semibold text-text-primary">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-bg-hover rounded-[4px]">
            <X className="w-4 h-4 text-text-tertiary" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </div>
      <style jsx>{`
        @keyframes slideIn { from { transform: translateX(20px); opacity: 0.4; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

// カテゴリ詳細
function CategoryDetail({ category, current, previous, range }: {
  category: FlowCategory;
  current: ReturnType<typeof aggregate>;
  previous: ReturnType<typeof aggregate>;
  range: RangeKey;
}) {
  const t = current.byCat[category];
  const prevT = previous.byCat[category];
  const isGame = GAME_CATEGORIES.includes(category);
  const profit = t.in - t.out;
  const prevProfit = prevT.in - prevT.out;
  const delta = prevProfit !== 0 ? ((profit - prevProfit) / Math.abs(prevProfit)) * 100 : null;

  // 日別純利益
  const daily = current.days.map(d => {
    const c = d.byCat[category];
    return { date: d.date, profit: c.in - c.out, out: c.out, in: c.in };
  });
  const maxAbs = Math.max(...daily.map(d => Math.abs(d.profit)), 1);

  // 曜日別
  const byDow: { dow: string; profit: number; count: number }[] = ["日","月","火","水","木","金","土"].map(d => ({ dow: d, profit: 0, count: 0 }));
  daily.forEach(d => {
    const dow = new Date(d.date).getDay();
    byDow[dow].profit += d.profit;
    byDow[dow].count += 1;
  });
  const bestDow = byDow.reduce((b, c) => (c.count > 0 && c.profit / c.count > (b.count > 0 ? b.profit / b.count : -Infinity) ? c : b), byDow[0]);
  const worstDow = byDow.reduce((b, c) => (c.count > 0 && c.profit / c.count < (b.count > 0 ? b.profit / b.count : Infinity) ? c : b), byDow[0]);

  const summary = generateCategorySummary(category, profit, delta, bestDow, worstDow, isGame);

  return (
    <div className="space-y-5">
      {/* ヘッダー指標 */}
      <div className="grid grid-cols-3 gap-4 pb-4 border-b border-[rgba(28,46,60,0.08)]">
        <Stat label="期間利益" value={`${profit >= 0 ? "+" : "−"}¥${Math.abs(profit).toLocaleString()}`} color={profit >= 0 ? "#0e7a55" : "#a4291f"} />
        <Stat label="払出" value={`¥${t.out.toLocaleString()}`} />
        <Stat label="回収" value={isGame ? `¥${t.in.toLocaleString()}` : "—"} />
      </div>

      {/* 自動コメント */}
      <div className="bg-[#fafafa] border border-[rgba(28,46,60,0.06)] rounded-[6px] px-3.5 py-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Sparkles className="w-3 h-3 text-text-tertiary" />
          <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">自動分析</span>
        </div>
        <p className="text-[12.5px] text-text-primary leading-[1.7]">{summary}</p>
      </div>

      {/* 日別グラフ */}
      <div>
        <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">日別純利益</p>
        <div className="border border-[rgba(28,46,60,0.06)] rounded-[6px] bg-white py-3 px-2">
          <div className="grid items-center gap-px relative" style={{ gridTemplateColumns: `repeat(${daily.length}, 1fr)`, height: 100 }}>
            <span className="absolute left-0 right-0 top-1/2 h-px" style={{ background: "rgba(28,46,60,0.10)" }} />
            {daily.map(d => {
              const positive = d.profit >= 0;
              const h = (Math.abs(d.profit) / maxAbs) * 45;
              return (
                <div key={d.date} className="relative h-full flex items-center justify-center" title={`${dateLabel(d.date)} ${positive ? "+" : "−"}${Math.abs(d.profit).toLocaleString()}`}>
                  <div
                    className="w-[60%] rounded-[1px]"
                    style={{
                      height: `${h}%`,
                      background: positive ? "#0e7a55" : "#a4291f",
                      opacity: 0.85,
                      [positive ? "marginBottom" : "marginTop"]: "auto",
                      [positive ? "alignSelf" : "alignSelf"]: positive ? "flex-end" : "flex-start",
                    } as React.CSSProperties}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 曜日別 */}
      {isGame && (
        <div>
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">曜日別 (1日平均)</p>
          <div className="grid grid-cols-7 gap-1">
            {byDow.map(d => {
              const avg = d.count > 0 ? d.profit / d.count : 0;
              const positive = avg >= 0;
              const max = Math.max(...byDow.map(x => Math.abs(x.count > 0 ? x.profit / x.count : 0)), 1);
              const h = (Math.abs(avg) / max) * 50;
              return (
                <div key={d.dow} className="flex flex-col items-center gap-1">
                  <div className="h-[70px] flex flex-col justify-center w-full">
                    <div
                      className="w-full rounded-[2px]"
                      style={{
                        height: `${h}px`,
                        background: positive ? "#0e7a55" : "#a4291f",
                        opacity: 0.85,
                        marginTop: positive ? "auto" : 0,
                        marginBottom: positive ? 0 : "auto",
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-text-secondary">{d.dow}</span>
                  <span className="text-[9px] tabular-nums text-text-tertiary">{avg >= 0 ? "+" : "−"}{Math.abs(Math.round(avg)).toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 詳細統計 */}
      {range !== "all" && prevT.in + prevT.out > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">前{RANGE_LABEL[range]}との比較</p>
          <table className="w-full text-[12px]">
            <tbody>
              <tr className="border-b border-[rgba(28,46,60,0.06)]"><td className="py-1.5 text-text-tertiary">払出</td><td className="text-right tabular-nums">{prevT.out.toLocaleString()} → {t.out.toLocaleString()}</td></tr>
              {isGame && <tr className="border-b border-[rgba(28,46,60,0.06)]"><td className="py-1.5 text-text-tertiary">回収</td><td className="text-right tabular-nums">{prevT.in.toLocaleString()} → {t.in.toLocaleString()}</td></tr>}
              <tr><td className="py-1.5 text-text-tertiary">利益</td><td className="text-right tabular-nums font-semibold" style={{ color: profit >= 0 ? "#0e7a55" : "#a4291f" }}>{prevProfit.toLocaleString()} → {profit.toLocaleString()}</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// 日次明細
function DayDetail({ date, day }: { date: string; day?: { date: string; out: number; in: number; byCat: Record<FlowCategory, { out: number; in: number }>; entries: FlowEntry[] } }) {
  if (!day) return <p className="text-[12px] text-text-tertiary">データなし</p>;
  const net = day.in - day.out;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4 pb-4 border-b border-[rgba(28,46,60,0.08)]">
        <Stat label="純利益" value={`${net >= 0 ? "+" : "−"}¥${Math.abs(net).toLocaleString()}`} color={net >= 0 ? "#0e7a55" : "#a4291f"} />
        <Stat label="払出" value={`¥${day.out.toLocaleString()}`} />
        <Stat label="回収" value={`¥${day.in.toLocaleString()}`} />
      </div>

      <div>
        <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">カテゴリ別</p>
        <div className="space-y-1">
          {ALL_CATEGORIES.map(c => {
            const cd = day.byCat[c];
            if (cd.out === 0 && cd.in === 0) return null;
            const isGame = GAME_CATEGORIES.includes(c);
            const profit = cd.in - cd.out;
            return (
              <div key={c} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#fafafa] rounded-[4px]">
                <span className="w-4 h-4 rounded-[3px] flex items-center justify-center" style={{ background: `${CATEGORY_COLOR[c]}14`, color: CATEGORY_COLOR[c] }}>
                  <span className="[&>svg]:w-2.5 [&>svg]:h-2.5">{CATEGORY_ICON[c]}</span>
                </span>
                <span className="text-[12px] flex-1 truncate">{CATEGORY_LABEL[c]}</span>
                <span className="text-[11px] text-text-tertiary tabular-nums">−{cd.out.toLocaleString()}</span>
                {isGame && <span className="text-[11px] text-text-tertiary tabular-nums">+{cd.in.toLocaleString()}</span>}
                <span className="text-[12px] font-semibold tabular-nums w-20 text-right" style={{ color: profit >= 0 ? "#0e7a55" : "#a4291f" }}>
                  {profit >= 0 ? "+" : "−"}{Math.abs(profit).toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">明細 ({day.entries.length}件)</p>
        <div className="border border-[rgba(28,46,60,0.06)] rounded-[6px] overflow-hidden">
          <table className="w-full text-[11px]">
            <thead className="bg-[#fafafa] border-b border-[rgba(28,46,60,0.06)]">
              <tr>
                <th className="px-2 py-1.5 text-left font-semibold text-text-tertiary">区分</th>
                <th className="px-2 py-1.5 text-left font-semibold text-text-tertiary">顧客</th>
                <th className="px-2 py-1.5 text-right font-semibold text-text-tertiary">枚数</th>
              </tr>
            </thead>
            <tbody>
              {day.entries.map(e => (
                <tr key={e.id} className="border-b border-[rgba(28,46,60,0.04)] last:border-0">
                  <td className="px-2 py-1.5">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: CATEGORY_COLOR[e.category] }} />
                      <span className="text-[10px]">{CATEGORY_SHORT[e.category]}</span>
                      <span className={`text-[9px] font-semibold px-1 rounded ${e.direction === "out" ? "text-[#a4291f] bg-[#a4291f]/10" : "text-[#0e7a55] bg-[#0e7a55]/10"}`}>
                        {e.direction === "out" ? "払出" : "回収"}
                      </span>
                    </span>
                  </td>
                  <td className="px-2 py-1.5">{e.customer || "—"}</td>
                  <td className={`px-2 py-1.5 text-right tabular-nums font-semibold ${e.direction === "out" ? "text-[#a4291f]" : "text-[#0e7a55]"}`}>
                    {e.direction === "out" ? "−" : "+"}{e.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">{label}</span>
      <span className="text-[18px] font-semibold tabular-nums mt-0.5 leading-none" style={{ color: color ?? "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

// ============================================================
// INSIGHTS
// ============================================================
interface Insight {
  label: string;
  text: string;
  severity: "good" | "warning" | "danger";
  value?: number;
  formatted?: string;
  onClick?: () => void;
}

function generateInsights(
  current: ReturnType<typeof aggregate>,
  previous: ReturnType<typeof aggregate>,
  range: RangeKey,
): Insight[] {
  const out: Insight[] = [];

  // 1) 前期比 利益変動が大きいカテゴリ Top1
  const deltas = ALL_CATEGORIES.map(c => {
    const cur = current.byCat[c]; const prev = previous.byCat[c];
    const curProfit = cur.in - cur.out;
    const prevProfit = prev.in - prev.out;
    return { c, cur: curProfit, prev: prevProfit, delta: curProfit - prevProfit };
  }).filter(d => Math.abs(d.delta) > 0);
  deltas.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  if (deltas[0] && range !== "all") {
    const d = deltas[0];
    out.push({
      label: "前期比 最大変化",
      text: `${CATEGORY_LABEL[d.c]} の利益が${d.delta >= 0 ? "増加" : "減少"}`,
      severity: d.delta >= 0 ? "good" : "warning",
      value: d.delta,
      formatted: `${d.delta >= 0 ? "+" : "−"}¥${Math.abs(d.delta).toLocaleString()}`,
    });
  }

  // 2) 直近1日の最大下振れカテゴリ
  if (current.days.length >= 7) {
    const lastDay = current.days[current.days.length - 1];
    const last7 = current.days.slice(-8, -1);
    GAME_CATEGORIES.forEach(c => {
      const lastProfit = lastDay.byCat[c].in - lastDay.byCat[c].out;
      const avgProfit = last7.length > 0 ? last7.reduce((s, d) => s + (d.byCat[c].in - d.byCat[c].out), 0) / last7.length : 0;
      const dev = lastProfit - avgProfit;
      if (lastProfit < 0 && Math.abs(dev) > Math.abs(avgProfit) * 1.2 && Math.abs(dev) > 5000) {
        out.push({
          label: "前日アラート",
          text: `${CATEGORY_LABEL[c]} 利益が7日平均を大幅下回り`,
          severity: "danger",
          value: lastProfit,
          formatted: `¥${lastProfit.toLocaleString()}`,
        });
      }
    });
  }

  // 3) 最大利益カテゴリ
  const ranked = ALL_CATEGORIES.map(c => ({ c, p: current.byCat[c].in - current.byCat[c].out }))
    .filter(r => r.p > 0).sort((a, b) => b.p - a.p);
  if (ranked[0]) {
    out.push({
      label: "今期 利益源",
      text: `${CATEGORY_LABEL[ranked[0].c]} が最大の利益源`,
      severity: "good",
      value: ranked[0].p,
      formatted: `+¥${ranked[0].p.toLocaleString()}`,
    });
  }

  // 4) 純利益が前期比でマイナスなら
  if (range !== "all" && current.profit < previous.profit && previous.profit !== 0) {
    const drop = current.profit - previous.profit;
    out.push({
      label: "全体トレンド",
      text: "全体の純利益が前期間より減少",
      severity: "warning",
      value: drop,
      formatted: `¥${drop.toLocaleString()}`,
    });
  }

  return out.slice(0, 4);
}

function generateCategorySummary(
  category: FlowCategory, profit: number, delta: number | null,
  bestDow: { dow: string; profit: number; count: number },
  worstDow: { dow: string; profit: number; count: number },
  isGame: boolean,
): string {
  const sentences: string[] = [];
  if (isGame) {
    sentences.push(`このカテゴリの期間利益は${profit >= 0 ? "プラス" : "マイナス"}¥${Math.abs(profit).toLocaleString()}。`);
    if (delta != null) {
      if (delta > 5) sentences.push(`前期比${delta.toFixed(1)}%増と好調です。`);
      else if (delta < -5) sentences.push(`前期比${delta.toFixed(1)}%減と弱含み。`);
      else sentences.push(`前期と概ね同水準で推移しています。`);
    }
    if (bestDow.count > 0) sentences.push(`${bestDow.dow}曜が最も平均利益が高い傾向。`);
    if (worstDow.profit < 0) sentences.push(`${worstDow.dow}曜は赤字傾向で要注目。`);
  } else {
    sentences.push(`このカテゴリは${CATEGORY_LABEL[category]}による払出のみで、期間内の払出総額は¥${(-profit).toLocaleString()}。`);
    if (delta != null && Math.abs(delta) > 10) sentences.push(`前期比 ${delta > 0 ? "減少" : "増加"} (${delta.toFixed(1)}%)。`);
  }
  return sentences.join(" ");
}
