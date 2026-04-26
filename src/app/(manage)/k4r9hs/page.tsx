"use client";

import { useState, useMemo } from "react";
import {
  FileDown, ChevronLeft, ChevronRight,
  Banknote, Ticket, Star, Gift, Trophy, Spade, Diamond, Layers,
} from "lucide-react";

// ===== カテゴリ =====
type FlowCategory =
  | "purchase_cash" | "purchase_multike" | "purchase_point" | "prize"
  | "tournament" | "bj" | "baccarat" | "ring";

type Direction = "out" | "in";

interface FlowEntry {
  id: string; date: string; category: FlowCategory; direction: Direction;
  amount: number; customer?: string; table?: string; staff?: string;
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
  purchase_cash: "#0ea5e9", purchase_multike: "#7c3aed", purchase_point: "#f59e0b",
  prize: "#ec4899", tournament: "#10b981", bj: "#1e293b", baccarat: "#8b5cf6", ring: "#3a8f7c",
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
const GAME_CATS: FlowCategory[] = ["tournament", "bj", "baccarat", "ring"];
const PURCHASE_CATS: FlowCategory[] = ["purchase_cash", "purchase_multike", "purchase_point", "prize"];
const ALL_CATS: FlowCategory[] = [...PURCHASE_CATS, ...GAME_CATS];

// ===== デモデータ (180日分) =====
function generateDemoFlows(): FlowEntry[] {
  const flows: FlowEntry[] = [];
  const today = new Date("2026-04-23");
  let id = 1;
  const customers = ["タロウ", "ハナ", "ユウ", "ケン", "ミィ", "ショウ", "ダイ", "アユ"];
  const ringTables = ["A-1", "A-2", "A-3", "B-1", "B-2", "VIP-1", "VIP-2"];
  for (let dayOffset = 179; dayOffset >= 0; dayOffset--) {
    const d = new Date(today); d.setDate(d.getDate() - dayOffset);
    const dateStr = d.toISOString().split("T")[0];
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const baseCount = isWeekend ? 30 : 18;
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
      const isGame = GAME_CATS.includes(cat);
      const customer = customers[Math.floor(Math.random() * customers.length)];
      if (isGame) {
        const wager = [500, 1000, 2000, 3000, 5000][Math.floor(Math.random() * 5)];
        flows.push({ id: `f${id++}`, date: dateStr, category: cat, direction: "in", amount: wager, customer, table: cat === "ring" ? ringTables[Math.floor(Math.random() * 7)] : undefined });
        const winRate = cat === "tournament" ? 0.3 : 0.48;
        if (Math.random() < winRate) {
          const payout = Math.round(wager * (cat === "tournament" ? 3 : 1.9));
          flows.push({ id: `f${id++}`, date: dateStr, category: cat, direction: "out", amount: payout, customer, table: cat === "ring" ? ringTables[Math.floor(Math.random() * 7)] : undefined });
        }
      } else {
        let amt = 1000;
        if (cat === "purchase_cash") amt = [1000, 3000, 5000, 10000, 20000][Math.floor(Math.random() * 5)];
        else if (cat === "purchase_multike") amt = [500, 1000, 2000][Math.floor(Math.random() * 3)];
        else if (cat === "purchase_point") amt = [300, 500, 1000][Math.floor(Math.random() * 3)];
        else if (cat === "prize") amt = [500, 1000, 2000][Math.floor(Math.random() * 3)];
        flows.push({ id: `f${id++}`, date: dateStr, category: cat, direction: "out", amount: amt, customer });
      }
    }
  }
  return flows;
}
const ALL_FLOWS = generateDemoFlows();
const TODAY = new Date("2026-04-23");

// ===== バケット =====
type ViewMode = "day" | "week" | "month" | "calendar";

interface Bucket {
  key: string;        // バケットID
  label: string;      // 表示ラベル
  shortLabel: string; // 短縮ラベル(軸用)
  date: string;       // 代表日
  out: number;
  in: number;
  count: number;
}

function dayKey(d: Date): string {
  return d.toISOString().split("T")[0];
}
function weekKey(d: Date): string {
  // 週の開始日(月曜)
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const m = new Date(d); m.setDate(m.getDate() + diff);
  return m.toISOString().split("T")[0];
}
function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function makeBuckets(view: ViewMode, flows: FlowEntry[], anchor: Date): Bucket[] {
  // 表示するバケット数
  const NUM = view === "day" ? 30 : view === "week" ? 12 : view === "month" ? 6 : 0;
  if (view === "calendar") return [];

  // バケット初期化
  const buckets = new Map<string, Bucket>();
  for (let i = NUM - 1; i >= 0; i--) {
    const d = new Date(anchor);
    if (view === "day") {
      d.setDate(d.getDate() - i);
      const k = dayKey(d);
      const dow = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
      buckets.set(k, {
        key: k, label: `${d.getMonth() + 1}/${d.getDate()}(${dow})`,
        shortLabel: `${d.getMonth() + 1}/${d.getDate()}`,
        date: k, out: 0, in: 0, count: 0,
      });
    } else if (view === "week") {
      d.setDate(d.getDate() - i * 7);
      const k = weekKey(d);
      const start = new Date(k);
      const end = new Date(start); end.setDate(end.getDate() + 6);
      buckets.set(k, {
        key: k,
        label: `${start.getMonth() + 1}/${start.getDate()}〜${end.getMonth() + 1}/${end.getDate()}`,
        shortLabel: `${start.getMonth() + 1}/${start.getDate()}`,
        date: k, out: 0, in: 0, count: 0,
      });
    } else if (view === "month") {
      d.setMonth(d.getMonth() - i);
      const k = monthKey(d);
      buckets.set(k, {
        key: k, label: `${d.getFullYear()}年${d.getMonth() + 1}月`,
        shortLabel: `${d.getMonth() + 1}月`,
        date: `${k}-01`, out: 0, in: 0, count: 0,
      });
    }
  }

  // 集計
  flows.forEach(f => {
    const d = new Date(f.date);
    const k = view === "day" ? dayKey(d) : view === "week" ? weekKey(d) : monthKey(d);
    const b = buckets.get(k);
    if (!b) return;
    if (f.direction === "out") b.out += f.amount; else b.in += f.amount;
    b.count += 1;
  });

  return Array.from(buckets.values());
}

// カレンダー集計(月単位)
interface DayCell { date: string; day: number; dow: number; out: number; in: number; count: number; inMonth: boolean; }
function makeCalendar(flows: FlowEntry[], year: number, month: number): DayCell[] {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const startPad = first.getDay();
  const totalDays = last.getDate();
  const cells: DayCell[] = [];
  // 前月パディング
  for (let i = 0; i < startPad; i++) {
    const d = new Date(year, month - 1, -(startPad - i - 1));
    cells.push({ date: dayKey(d), day: d.getDate(), dow: d.getDay(), out: 0, in: 0, count: 0, inMonth: false });
  }
  // 当月
  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(year, month - 1, day);
    cells.push({ date: dayKey(d), day, dow: d.getDay(), out: 0, in: 0, count: 0, inMonth: true });
  }
  // 翌月パディング(6行になるように)
  while (cells.length < 42) {
    const last = cells[cells.length - 1];
    const d = new Date(last.date); d.setDate(d.getDate() + 1);
    cells.push({ date: dayKey(d), day: d.getDate(), dow: d.getDay(), out: 0, in: 0, count: 0, inMonth: false });
  }
  // データ反映
  flows.forEach(f => {
    const cell = cells.find(c => c.date === f.date);
    if (!cell) return;
    if (f.direction === "out") cell.out += f.amount; else cell.in += f.amount;
    cell.count += 1;
  });
  return cells;
}

// ============================================================
export default function ChipFlowPage() {
  const [view, setView] = useState<ViewMode>("day");
  const [catFilter, setCatFilter] = useState<"all" | FlowCategory>("all");
  const [calMonth, setCalMonth] = useState(() => ({ y: TODAY.getFullYear(), m: TODAY.getMonth() + 1 }));

  // フィルタ済みデータ
  const filtered = useMemo(() => {
    return catFilter === "all" ? ALL_FLOWS : ALL_FLOWS.filter(f => f.category === catFilter);
  }, [catFilter]);

  const buckets = useMemo(() => makeBuckets(view, filtered, TODAY), [view, filtered]);
  const calendar = useMemo(() => makeCalendar(filtered, calMonth.y, calMonth.m), [filtered, calMonth]);

  // KPI(期間内合計)
  const totalOut = (view === "calendar" ? calendar.filter(c => c.inMonth) : buckets).reduce((s, b) => s + b.out, 0);
  const totalIn = (view === "calendar" ? calendar.filter(c => c.inMonth) : buckets).reduce((s, b) => s + b.in, 0);
  const profit = totalIn - totalOut;

  const isPurchaseOnly = catFilter !== "all" && PURCHASE_CATS.includes(catFilter);

  function exportCSV() {
    if (view === "calendar") {
      const header = "日付,払出,回収,純利益,件数";
      const rows = calendar.filter(c => c.inMonth).map(c => `${c.date},${c.out},${c.in},${c.in - c.out},${c.count}`);
      download(`chip_flow_calendar_${calMonth.y}-${calMonth.m}.csv`, header, rows);
    } else {
      const header = `${view === "day" ? "日付" : view === "week" ? "週" : "月"},払出,回収,純利益,件数`;
      const rows = buckets.map(b => `${b.label},${b.out},${b.in},${b.in - b.out},${b.count}`);
      download(`chip_flow_${view}.csv`, header, rows);
    }
  }
  function download(filename: string, header: string, rows: string[]) {
    const csv = "\ufeff" + [header, ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      {/* ===== ヘッダー: ビュー切替 + カテゴリフィルタ + CSV ===== */}
      <section className="flex items-center gap-3 flex-wrap">
        <div className="flex border border-[rgba(28,46,60,0.10)] rounded-[6px] overflow-hidden">
          {([
            { k: "day", label: "日別" },
            { k: "week", label: "週別" },
            { k: "month", label: "月別" },
            { k: "calendar", label: "カレンダー" },
          ] as { k: ViewMode; label: string }[]).map(v => (
            <button
              key={v.k}
              onClick={() => setView(v.k)}
              className={`px-4 py-1.5 text-[12px] font-medium transition-colors border-r border-[rgba(28,46,60,0.10)] last:border-r-0 ${
                view === v.k ? "bg-text-primary text-white" : "bg-white text-text-secondary hover:bg-bg-hover"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* カテゴリ選択 */}
        <CategorySelect value={catFilter} onChange={setCatFilter} />

        <div className="ml-auto">
          <button onClick={exportCSV} className="px-3 py-1.5 text-[12px] font-medium border border-[rgba(28,46,60,0.10)] rounded-[6px] hover:bg-bg-hover flex items-center gap-1">
            <FileDown className="w-3 h-3" />CSV
          </button>
        </div>
      </section>

      {/* ===== KPI 帯 ===== */}
      <section className="flex items-end gap-10 pb-4 border-b border-[rgba(28,46,60,0.08)]">
        <Kpi label="期間内 払出" value={totalOut} />
        <Kpi label="期間内 回収" value={totalIn} muted={isPurchaseOnly} />
        <Kpi
          label="純利益"
          value={profit}
          color={isPurchaseOnly ? undefined : profit >= 0 ? "#0e7a55" : "#a4291f"}
          large
          signed
          muted={isPurchaseOnly}
        />
      </section>

      {/* ===== メインビュー ===== */}
      {view === "calendar" ? (
        <CalendarView
          calMonth={calMonth}
          setCalMonth={setCalMonth}
          calendar={calendar}
          isPurchaseOnly={isPurchaseOnly}
        />
      ) : (
        <ChartAndTable buckets={buckets} view={view} isPurchaseOnly={isPurchaseOnly} />
      )}
    </div>
  );
}

// ============================================================
function Kpi({ label, value, color, large, signed, muted }: {
  label: string; value: number; color?: string; large?: boolean; signed?: boolean; muted?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-[0.16em]">{label}</span>
      <span
        className={`tabular-nums leading-none mt-1.5 tracking-tight font-semibold ${large ? "text-[32px]" : "text-[20px]"}`}
        style={{ color: muted ? "var(--text-tertiary)" : (color ?? "var(--text-primary)") }}
      >
        {muted ? "—" : `${signed && value >= 0 ? "+" : signed ? "−" : ""}¥${Math.abs(value).toLocaleString()}`}
      </span>
    </div>
  );
}

function CategorySelect({ value, onChange }: { value: "all" | FlowCategory; onChange: (v: "all" | FlowCategory) => void }) {
  const isAll = value === "all";
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value as "all" | FlowCategory)}
        className="appearance-none pl-9 pr-8 py-1.5 text-[12px] font-medium border border-[rgba(28,46,60,0.10)] rounded-[6px] bg-white hover:bg-bg-hover cursor-pointer min-w-[200px]"
      >
        <option value="all">すべてのルート</option>
        <optgroup label="購入ルート">
          {PURCHASE_CATS.map(c => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
        </optgroup>
        <optgroup label="使用ルート">
          {GAME_CATS.map(c => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
        </optgroup>
      </select>
      <span
        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-[3px] flex items-center justify-center pointer-events-none"
        style={{
          background: isAll ? "rgba(28,46,60,0.06)" : `${CATEGORY_COLOR[value as FlowCategory]}1a`,
          color: isAll ? "var(--text-tertiary)" : CATEGORY_COLOR[value as FlowCategory],
        }}
      >
        {isAll ? <Layers className="w-3 h-3" strokeWidth={1.8} /> : CATEGORY_ICON[value as FlowCategory]}
      </span>
      <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-text-tertiary rotate-90" />
    </div>
  );
}

// ============================================================
// チャート + テーブル
function ChartAndTable({ buckets, view, isPurchaseOnly }: {
  buckets: Bucket[]; view: ViewMode; isPurchaseOnly: boolean;
}) {
  if (buckets.length === 0) {
    return <div className="border border-[rgba(28,46,60,0.08)] rounded-[8px] py-12 text-center text-[12px] text-text-tertiary">データがありません</div>;
  }
  return (
    <>
      {/* チャート */}
      <section>
        <BarLineChart buckets={buckets} isPurchaseOnly={isPurchaseOnly} />
      </section>

      {/* テーブル */}
      <section>
        <h2 className="text-[14px] font-semibold text-text-primary tracking-tight mb-2.5">
          {view === "day" ? "日次明細" : view === "week" ? "週次明細" : "月次明細"}
        </h2>
        <div className="border border-[rgba(28,46,60,0.08)] rounded-[8px] overflow-hidden bg-white">
          <div className="grid grid-cols-[1fr_140px_140px_140px_80px] items-center px-4 py-2.5 border-b border-[rgba(28,46,60,0.08)] bg-[#fafafa] text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
            <span>{view === "day" ? "日付" : view === "week" ? "週" : "月"}</span>
            <span className="text-right">払出</span>
            <span className="text-right">回収</span>
            <span className="text-right">純利益</span>
            <span className="text-right">件数</span>
          </div>
          {buckets.slice().reverse().map(b => {
            const net = b.in - b.out;
            return (
              <div key={b.key} className="grid grid-cols-[1fr_140px_140px_140px_80px] items-center px-4 py-2 border-b border-[rgba(28,46,60,0.06)] last:border-b-0 hover:bg-[#fafafa] transition-colors">
                <span className="text-[12.5px] font-medium text-text-primary">{b.label}</span>
                <span className="text-right text-[12.5px] tabular-nums">¥{b.out.toLocaleString()}</span>
                <span className="text-right text-[12.5px] tabular-nums">{isPurchaseOnly ? "—" : `¥${b.in.toLocaleString()}`}</span>
                <span
                  className="text-right text-[12.5px] tabular-nums font-semibold"
                  style={{ color: isPurchaseOnly ? "var(--text-tertiary)" : net >= 0 ? "#0e7a55" : "#a4291f" }}
                >
                  {isPurchaseOnly ? "—" : `${net >= 0 ? "+" : "−"}¥${Math.abs(net).toLocaleString()}`}
                </span>
                <span className="text-right text-[11px] text-text-tertiary tabular-nums">{b.count}</span>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

// ============================================================
// 棒グラフ + 折れ線
function BarLineChart({ buckets, isPurchaseOnly }: { buckets: Bucket[]; isPurchaseOnly: boolean }) {
  const W = 1000;     // viewBox幅
  const H = 280;      // viewBox高
  const PAD_T = 16; const PAD_B = 32; const PAD_L = 56; const PAD_R = 56;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const maxBar = Math.max(...buckets.map(b => Math.max(b.out, b.in)), 1);
  const profits = buckets.map(b => b.in - b.out);
  const maxProfit = Math.max(...profits.map(p => Math.abs(p)), 1);

  const barTotalGroupW = innerW / buckets.length;
  const barW = Math.min(20, barTotalGroupW * 0.32);
  const groupGap = 2;

  // Y軸目盛(棒用)
  const ticksBar = niceTicks(0, maxBar, 4);

  // 折れ線(純利益)用Y軸 - 0が中央付近に来るようスケール
  const profitMax = maxProfit;
  function profitY(p: number): number {
    // 純利益軸: top=+max, mid=0, bottom=-max
    const ratio = (profitMax - p) / (profitMax * 2);
    return PAD_T + ratio * innerH;
  }
  function barY(v: number): number {
    return PAD_T + innerH - (v / maxBar) * innerH;
  }
  function barX(i: number, slot: number): number {
    // slot: 0=払出(左), 1=回収(右)
    const groupX = PAD_L + i * barTotalGroupW + barTotalGroupW / 2;
    const offset = slot === 0 ? -(barW / 2 + groupGap / 2) : (barW / 2 + groupGap / 2);
    return groupX + offset - barW / 2;
  }

  // 折れ線パス
  const linePath = buckets.map((b, i) => {
    const x = PAD_L + i * barTotalGroupW + barTotalGroupW / 2;
    const y = profitY(b.in - b.out);
    return `${i === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ");

  // 軸ラベル間引き
  const tickEvery = buckets.length > 14 ? Math.ceil(buckets.length / 10) : 1;

  return (
    <div className="border border-[rgba(28,46,60,0.08)] rounded-[8px] bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 text-[11px]">
          <Legend color="#a4291f" label="払出" shape="bar" />
          {!isPurchaseOnly && <Legend color="#0e7a55" label="回収" shape="bar" />}
          {!isPurchaseOnly && <Legend color="#1d2a33" label="純利益" shape="line" />}
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[280px]" preserveAspectRatio="none">
          {/* Y軸 グリッド (棒用、左軸) */}
          {ticksBar.map((t, i) => {
            const y = barY(t);
            return (
              <g key={`tb${i}`}>
                <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="rgba(28,46,60,0.06)" strokeDasharray={i === 0 ? "" : "2 3"} />
                <text x={PAD_L - 8} y={y + 3} textAnchor="end" className="fill-current text-text-tertiary" style={{ fontSize: 10 }}>
                  {t >= 1000 ? `${Math.round(t / 1000)}K` : t}
                </text>
              </g>
            );
          })}

          {/* 純利益用Y軸(右) */}
          {!isPurchaseOnly && [profitMax, profitMax / 2, 0, -profitMax / 2, -profitMax].map((t, i) => {
            const y = profitY(t);
            return (
              <text key={`tp${i}`} x={W - PAD_R + 8} y={y + 3} textAnchor="start" className="fill-current text-text-tertiary" style={{ fontSize: 10 }}>
                {t >= 0 ? "" : "−"}{Math.abs(t) >= 1000 ? `${Math.round(Math.abs(t) / 1000)}K` : Math.abs(Math.round(t))}
              </text>
            );
          })}

          {/* 0ライン強調 */}
          <line x1={PAD_L} x2={W - PAD_R} y1={profitY(0)} y2={profitY(0)} stroke="rgba(28,46,60,0.2)" strokeDasharray="3 3" />

          {/* バー */}
          {buckets.map((b, i) => (
            <g key={b.key}>
              {/* 払出 */}
              <rect
                x={barX(i, 0)} y={barY(b.out)}
                width={barW} height={innerH - (barY(b.out) - PAD_T)}
                fill="#a4291f" fillOpacity={0.85} rx={1}
              />
              {/* 回収 (購入のみ非表示) */}
              {!isPurchaseOnly && (
                <rect
                  x={barX(i, 1)} y={barY(b.in)}
                  width={barW} height={innerH - (barY(b.in) - PAD_T)}
                  fill="#0e7a55" fillOpacity={0.85} rx={1}
                />
              )}
            </g>
          ))}

          {/* 折れ線(純利益) */}
          {!isPurchaseOnly && (
            <>
              <path d={linePath} fill="none" stroke="#1d2a33" strokeWidth={1.5} />
              {buckets.map((b, i) => {
                const x = PAD_L + i * barTotalGroupW + barTotalGroupW / 2;
                const y = profitY(b.in - b.out);
                return <circle key={`p${i}`} cx={x} cy={y} r={2.5} fill="#fff" stroke="#1d2a33" strokeWidth={1.5} />;
              })}
            </>
          )}

          {/* X軸ラベル */}
          {buckets.map((b, i) => {
            if (i % tickEvery !== 0 && i !== buckets.length - 1) return null;
            const x = PAD_L + i * barTotalGroupW + barTotalGroupW / 2;
            return (
              <text
                key={`xl${i}`}
                x={x}
                y={H - 12}
                textAnchor="middle"
                className="fill-current text-text-tertiary"
                style={{ fontSize: 10 }}
              >
                {b.shortLabel}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function Legend({ color, label, shape }: { color: string; label: string; shape: "bar" | "line" }) {
  return (
    <span className="flex items-center gap-1.5 text-text-secondary">
      {shape === "bar" ? (
        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color, opacity: 0.85 }} />
      ) : (
        <span className="flex items-center">
          <span className="w-3 h-px" style={{ background: color }} />
          <span className="w-1.5 h-1.5 rounded-full -mx-px" style={{ background: "#fff", border: `1.5px solid ${color}` }} />
          <span className="w-3 h-px" style={{ background: color }} />
        </span>
      )}
      <span>{label}</span>
    </span>
  );
}

function niceTicks(min: number, max: number, count: number): number[] {
  const range = max - min;
  const rough = range / count;
  const exp = Math.floor(Math.log10(rough));
  const step = Math.pow(10, exp) * (rough / Math.pow(10, exp) >= 5 ? 5 : rough / Math.pow(10, exp) >= 2 ? 2 : 1);
  const ticks: number[] = [];
  for (let v = 0; v <= max + step / 2; v += step) ticks.push(Math.round(v));
  return ticks;
}

// ============================================================
// カレンダービュー
function CalendarView({ calMonth, setCalMonth, calendar, isPurchaseOnly }: {
  calMonth: { y: number; m: number };
  setCalMonth: (v: { y: number; m: number }) => void;
  calendar: DayCell[];
  isPurchaseOnly: boolean;
}) {
  const monthCells = calendar.filter(c => c.inMonth);
  const maxAbs = Math.max(...monthCells.map(c => Math.max(c.out, c.in)), 1);

  function changeMonth(dir: -1 | 1) {
    const d = new Date(calMonth.y, calMonth.m - 1 + dir, 1);
    setCalMonth({ y: d.getFullYear(), m: d.getMonth() + 1 });
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-bg-hover rounded-[4px]"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-[15px] font-semibold tracking-tight tabular-nums">{calMonth.y}年{calMonth.m}月</span>
          <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-bg-hover rounded-[4px]"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="text-[11px] text-text-tertiary">
          色の濃さ＝動いたチップ量
        </div>
      </div>

      <div className="border border-[rgba(28,46,60,0.08)] rounded-[8px] bg-white overflow-hidden">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 border-b border-[rgba(28,46,60,0.08)] bg-[#fafafa]">
          {["日", "月", "火", "水", "木", "金", "土"].map((d, i) => (
            <div
              key={d}
              className={`text-center text-[10px] font-semibold uppercase tracking-wider py-2 ${
                i === 0 ? "text-[#a4291f]" : i === 6 ? "text-[#0e7a55]" : "text-text-tertiary"
              }`}
            >{d}</div>
          ))}
        </div>

        {/* 日セル */}
        <div className="grid grid-cols-7">
          {calendar.map((c, i) => {
            const net = c.in - c.out;
            const total = c.out + c.in;
            const intensity = total > 0 ? Math.min(1, total / maxAbs) : 0;
            return (
              <div
                key={i}
                className={`relative aspect-[1.05/1] border-b border-r border-[rgba(28,46,60,0.06)] p-2 last:border-r-0 ${
                  i % 7 === 6 ? "border-r-0" : ""
                } ${!c.inMonth ? "bg-[#fafafa]/60" : ""}`}
              >
                {/* 背景強度(ヒートマップ) */}
                {c.inMonth && intensity > 0 && (
                  <span
                    className="absolute inset-1 rounded-[3px] pointer-events-none"
                    style={{
                      background: isPurchaseOnly
                        ? `rgba(164, 41, 31, ${intensity * 0.12})`
                        : net >= 0
                          ? `rgba(14, 122, 85, ${intensity * 0.16})`
                          : `rgba(164, 41, 31, ${intensity * 0.16})`,
                    }}
                  />
                )}

                <div className="relative">
                  <div className={`text-[11px] font-semibold tabular-nums ${
                    !c.inMonth ? "text-text-tertiary"
                    : c.dow === 0 ? "text-[#a4291f]"
                    : c.dow === 6 ? "text-[#0e7a55]"
                    : "text-text-primary"
                  }`}>{c.day}</div>

                  {c.inMonth && total > 0 && (
                    <div className="mt-1 space-y-0.5">
                      <div className="text-[9.5px] tabular-nums text-[#a4291f] font-medium">
                        −{c.out >= 1000 ? `${(c.out / 1000).toFixed(0)}K` : c.out}
                      </div>
                      {!isPurchaseOnly && (
                        <div className="text-[9.5px] tabular-nums text-[#0e7a55] font-medium">
                          +{c.in >= 1000 ? `${(c.in / 1000).toFixed(0)}K` : c.in}
                        </div>
                      )}
                      {!isPurchaseOnly && (
                        <div className={`text-[10.5px] font-bold tabular-nums pt-0.5 border-t mt-0.5 border-[rgba(28,46,60,0.06)] ${
                          net >= 0 ? "text-[#0e7a55]" : "text-[#a4291f]"
                        }`}>
                          {net >= 0 ? "+" : "−"}{Math.abs(net) >= 1000 ? `${(Math.abs(net) / 1000).toFixed(0)}K` : Math.abs(net)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* カレンダー下部: 月内サマリ */}
      <div className="grid grid-cols-3 gap-px bg-[rgba(28,46,60,0.08)] border border-[rgba(28,46,60,0.08)] rounded-[6px] overflow-hidden mt-4">
        <div className="bg-white px-4 py-3">
          <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">月内 営業日</p>
          <p className="text-[18px] font-semibold tabular-nums mt-1 leading-none">{monthCells.filter(c => c.count > 0).length}日</p>
        </div>
        <div className="bg-white px-4 py-3">
          <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">最大利益日</p>
          <p className="text-[18px] font-semibold tabular-nums mt-1 leading-none text-[#0e7a55]">
            {(() => {
              const best = monthCells.reduce((b, c) => (c.in - c.out) > (b.in - b.out) ? c : b, monthCells[0] ?? { date: "", in: 0, out: 0 });
              return best && (best.in - best.out) > 0 ? `${new Date(best.date).getDate()}日 +¥${(best.in - best.out).toLocaleString()}` : "—";
            })()}
          </p>
        </div>
        <div className="bg-white px-4 py-3">
          <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">最大損失日</p>
          <p className="text-[18px] font-semibold tabular-nums mt-1 leading-none text-[#a4291f]">
            {(() => {
              const worst = monthCells.reduce((b, c) => (c.in - c.out) < (b.in - b.out) ? c : b, monthCells[0] ?? { date: "", in: 0, out: 0 });
              return worst && (worst.in - worst.out) < 0 ? `${new Date(worst.date).getDate()}日 −¥${Math.abs(worst.in - worst.out).toLocaleString()}` : "—";
            })()}
          </p>
        </div>
      </div>
    </section>
  );
}
