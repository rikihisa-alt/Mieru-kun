"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePersisted, usePersistedState } from "@/lib/persist/store";
import { salesOrderStore } from "@/lib/v2/stores";
import { productStore } from "@/lib/store/domain-stores";
import { toHalfWidthNumber } from "@/lib/v2/points";
import { PageHeader, Panel, VStack, HStack, Kpis, Kpi, Empty, Btn, Tabs, Field, Chip, Banner } from "@/components/v2/ui";
import { FileDown, ArrowRight, Plus, X } from "lucide-react";
import { printDoc, tableHtml, kpisHtml, sectionHtml } from "@/lib/v2/pdf";

// =================================================================
// 月次損益 (簡易計算)
// =================================================================
interface FixedCostItem {
  id: string;
  name: string;
  amount: number; // 月額
}
const FIXED_COSTS_KEY = "v2_fixed_costs_v1";
const DEFAULT_FIXED_COSTS: FixedCostItem[] = [
  { id: "fc_rent", name: "家賃", amount: 0 },
  { id: "fc_utility", name: "水道光熱", amount: 0 },
  { id: "fc_labor", name: "人件費目安", amount: 0 },
  { id: "fc_misc", name: "雑費", amount: 0 },
];

/** 不正な数値(負数・NaN)は0以上の整数に丸める */
function sanitizeAmount(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.trunc(n));
}

type RevenueOrderLike = { status: string; settledAt?: string; createdAt: string; paymentMethod?: string; unpaid?: boolean; paidAt?: string };

/** 注文が入金済みとして計上されるべきか判定し、計上月(YYYY-MM)を返す。未入金/未精算は null */
function getRevenueMonth(o: RevenueOrderLike): string | null {
  if (o.status !== "settled") return null;
  if (o.paymentMethod === "credit") {
    // 後払い: 消し込み(paidAt)が無い、または未払いフラグが立っている間は売上に計上しない
    if (o.unpaid || !o.paidAt) return null;
    return o.paidAt.slice(0, 7);
  }
  return (o.settledAt ?? o.createdAt).slice(0, 7);
}

/** 注文が入金済みとして計上されるべきか判定し、計上日(YYYY-MM-DD)を返す。未入金/未精算は null */
function getRevenueDate(o: RevenueOrderLike): string | null {
  if (o.status !== "settled") return null;
  if (o.paymentMethod === "credit") {
    if (o.unpaid || !o.paidAt) return null;
    return o.paidAt.slice(0, 10);
  }
  return (o.settledAt ?? o.createdAt).slice(0, 10);
}

function addMonths(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${y}年${m}月`;
}
function daysInMonth(ym: string): number {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

// =================================================================
// 売上目標・予実管理
// =================================================================
interface SalesTarget {
  monthlyTarget: number; // 月間売上目標(円)
  dailyTarget: number;   // 日商目標(円)
}
type SalesTargetMap = Record<string, SalesTarget>; // key = YYYY-MM
const SALES_TARGETS_KEY = "v2_sales_targets_v1";
const DEFAULT_SALES_TARGETS: SalesTargetMap = {};
const EMPTY_TARGET: SalesTarget = { monthlyTarget: 0, dailyTarget: 0 };

/** 達成率(0〜)から色分け区分を判定 */
function rateVariant(rate: number): "success" | "warn" | "danger" {
  if (rate >= 1) return "success";
  if (rate >= 0.7) return "warn";
  return "danger";
}

function RateChip({ rate }: { rate: number }) {
  return <Chip variant={rateVariant(rate)}>{Math.round(rate * 100)}%</Chip>;
}

function RateBar({ rate }: { rate: number }) {
  const v = rateVariant(rate);
  const color = v === "success" ? "var(--v2-success)" : v === "warn" ? "var(--v2-warn)" : "var(--v2-danger)";
  const pct = Math.max(0, Math.min(rate * 100, 100));
  return (
    <div style={{ background: "var(--v2-border)", borderRadius: 4, height: 8, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4 }} />
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState<"sales" | "pl" | "target">("sales");
  const [orders] = usePersisted(salesOrderStore);
  const [products] = usePersisted(productStore);
  const [fixedCosts, setFixedCosts] = usePersistedState<FixedCostItem[]>(FIXED_COSTS_KEY, DEFAULT_FIXED_COSTS);
  const [salesTargets, setSalesTargets] = usePersistedState<SalesTargetMap>(SALES_TARGETS_KEY, DEFAULT_SALES_TARGETS);
  const [plMonth, setPlMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [targetEditMonth, setTargetEditMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const today = new Date().toISOString().slice(0, 10);
  const monthPrefix = today.slice(0, 7);

  const totals = useMemo(() => {
    const settled = orders.filter(o => o.status === "settled");
    const todayOrders = settled.filter(o => (o.settledAt ?? o.createdAt).startsWith(today));
    const monthOrders = settled.filter(o => (o.settledAt ?? o.createdAt).startsWith(monthPrefix));
    const sum = (xs: typeof orders) => xs.reduce((s, o) => s + o.total, 0);
    const elapsedDays = new Date(today).getDate(); // 当月の経過日数(1日始まり)
    return {
      todayTotal: sum(todayOrders), todayCount: todayOrders.length,
      monthTotal: sum(monthOrders), monthCount: monthOrders.length,
      monthAvg: monthOrders.length > 0 ? Math.round(sum(monthOrders) / monthOrders.length) : 0,
      dailyAvg: elapsedDays > 0 ? Math.round(sum(monthOrders) / elapsedDays) : 0,
    };
  }, [orders, today, monthPrefix]);

  // 日次推移(直近30日)
  const last30 = useMemo(() => {
    const map = new Map<string, { date: string; total: number; count: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      map.set(k, { date: k, total: 0, count: 0 });
    }
    orders.filter(o => o.status === "settled").forEach(o => {
      const k = (o.settledAt ?? o.createdAt).slice(0, 10);
      if (map.has(k)) { const ent = map.get(k)!; ent.total += o.total; ent.count += 1; }
    });
    return Array.from(map.values());
  }, [orders]);

  // 商品原価マップ (未設定はスキップ対象として区別)
  const costMap = useMemo(() => {
    const m = new Map<string, number | undefined>();
    products.forEach(p => m.set(p.id, p.cost));
    return m;
  }, [products]);

  const fixedCostTotal = useMemo(() => fixedCosts.reduce((s, c) => s + c.amount, 0), [fixedCosts]);

  /** 指定月(YYYY-MM)の簡易損益を算出 */
  const calcMonthPL = useMemo(() => {
    return (ym: string) => {
      let sales = 0;
      let cost = 0;
      let hasMissingCost = false;
      orders.forEach(o => {
        const revMonth = getRevenueMonth(o);
        if (revMonth !== ym) return;
        sales += o.total;
        o.items.forEach(it => {
          const c = costMap.get(it.productId);
          if (c === undefined) { hasMissingCost = true; return; }
          cost += c * it.qty;
        });
      });
      const grossProfit = sales - cost;
      const operatingProfit = grossProfit - fixedCostTotal;
      return { sales, cost, fixedCost: fixedCostTotal, grossProfit, operatingProfit, hasMissingCost };
    };
  }, [orders, costMap, fixedCostTotal]);

  const currentPL = useMemo(() => calcMonthPL(plMonth), [calcMonthPL, plMonth]);

  // 直近6ヶ月分の推移(選択月を含む直近6ヶ月)
  const last6MonthsPL = useMemo(() => {
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) months.push(addMonths(plMonth, -i));
    return months.map(ym => ({ month: ym, ...calcMonthPL(ym) }));
  }, [plMonth, calcMonthPL]);

  // 対象月(targetEditMonth)の目標。未設定は0扱い
  const editingTarget = salesTargets[targetEditMonth] ?? EMPTY_TARGET;

  function updateTarget(ym: string, patch: Partial<SalesTarget>) {
    setSalesTargets(prev => ({ ...prev, [ym]: { ...(prev[ym] ?? EMPTY_TARGET), ...patch } }));
  }
  function updateTargetMonthly(raw: string) {
    updateTarget(targetEditMonth, { monthlyTarget: sanitizeAmount(toHalfWidthNumber(raw)) });
  }
  function updateTargetDaily(raw: string) {
    updateTarget(targetEditMonth, { dailyTarget: sanitizeAmount(toHalfWidthNumber(raw)) });
  }

  // 予実(当月・本日): 入金済み売上ベース(後払い未収は除外)
  const salesTargetStatus = useMemo(() => {
    const monthTarget = salesTargets[monthPrefix]?.monthlyTarget ?? 0;
    const dayTarget = salesTargets[monthPrefix]?.dailyTarget ?? 0;
    const monthActual = calcMonthPL(monthPrefix).sales;
    const todayActual = orders.reduce((s, o) => (getRevenueDate(o) === today ? s + o.total : s), 0);
    const elapsedDays = new Date(today).getDate();
    const totalDays = daysInMonth(monthPrefix);
    const dailyAvgActual = elapsedDays > 0 ? monthActual / elapsedDays : 0;
    const projectedTotal = Math.round(dailyAvgActual * totalDays);
    const monthRate = monthTarget > 0 ? monthActual / monthTarget : 0;
    const dayRate = dayTarget > 0 ? todayActual / dayTarget : 0;
    const remaining = Math.max(monthTarget - monthActual, 0);
    return { monthTarget, dayTarget, monthActual, todayActual, elapsedDays, totalDays, projectedTotal, monthRate, dayRate, remaining };
  }, [salesTargets, monthPrefix, orders, today, calcMonthPL]);

  // 達成率推移(直近6ヶ月)
  const salesTargetTrend = useMemo(() => {
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) months.push(addMonths(monthPrefix, -i));
    return months.map(ym => {
      const target = salesTargets[ym]?.monthlyTarget ?? 0;
      const actual = calcMonthPL(ym).sales;
      const rate = target > 0 ? actual / target : null;
      return { month: ym, target, actual, rate };
    });
  }, [monthPrefix, salesTargets, calcMonthPL]);

  function addFixedCost() {
    setFixedCosts([...fixedCosts, { id: `fc${Date.now()}`, name: "", amount: 0 }]);
  }
  function removeFixedCost(id: string) {
    setFixedCosts(fixedCosts.filter(c => c.id !== id));
  }
  function updateFixedCost(id: string, patch: Partial<FixedCostItem>) {
    setFixedCosts(fixedCosts.map(c => c.id === id ? { ...c, ...patch } : c));
  }
  function updateFixedCostAmount(id: string, raw: string) {
    updateFixedCost(id, { amount: sanitizeAmount(toHalfWidthNumber(raw)) });
  }

  function exportTodayPDF() {
    const todayOrders = orders.filter(o => o.status === "settled" && (o.settledAt ?? o.createdAt).startsWith(today));
    const body = kpisHtml([
      { label: "売上合計", value: `¥${totals.todayTotal.toLocaleString()}` },
      { label: "件数", value: `${totals.todayCount}件` },
      { label: "客単価", value: `¥${totals.todayCount > 0 ? Math.round(totals.todayTotal / totals.todayCount).toLocaleString() : 0}` },
      { label: "出力日", value: today },
    ]) + sectionHtml("精算明細",
      tableHtml(["時刻", "顧客", "卓", "支払", "金額"],
        todayOrders.map(o => [
          new Date(o.settledAt ?? o.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
          o.customer,
          o.table ?? "—",
          o.paymentMethod === "cash" ? "現金" : o.paymentMethod === "card" ? "カード" : o.paymentMethod === "credit" ? "後払い" : "QR",
          `¥${o.total.toLocaleString()}`,
        ]),
        { numCols: [4] }));
    printDoc({ title: "日次売上レポート", subtitle: today, body, storeName: "てんぽみえるくん" });
  }
  function exportMonthPDF() {
    const monthOrders = orders.filter(o => o.status === "settled" && (o.settledAt ?? o.createdAt).startsWith(monthPrefix));
    const byDay = new Map<string, { date: string; total: number; count: number }>();
    monthOrders.forEach(o => {
      const k = (o.settledAt ?? o.createdAt).slice(0, 10);
      const ex = byDay.get(k) ?? { date: k, total: 0, count: 0 };
      ex.total += o.total; ex.count += 1;
      byDay.set(k, ex);
    });
    const rows = Array.from(byDay.values()).sort((a,b) => a.date.localeCompare(b.date));
    const body = kpisHtml([
      { label: "月間売上", value: `¥${totals.monthTotal.toLocaleString()}` },
      { label: "件数", value: `${totals.monthCount}件` },
      { label: "日次平均", value: `¥${rows.length > 0 ? Math.round(totals.monthTotal / rows.length).toLocaleString() : 0}` },
      { label: "対象月", value: monthPrefix },
    ]) + sectionHtml("日次推移",
      tableHtml(["日付", "売上", "件数", "客単価"],
        rows.map(r => [r.date, `¥${r.total.toLocaleString()}`, String(r.count), `¥${Math.round(r.total / r.count).toLocaleString()}`]),
        { numCols: [1, 2, 3] }));
    printDoc({ title: "月次売上レポート", subtitle: monthPrefix, body, storeName: "てんぽみえるくん" });
  }

  const maxBar = Math.max(...last30.map(d => d.total), 1);
  const maxPLBar = Math.max(...last6MonthsPL.map(m => Math.abs(m.operatingProfit)), 1);

  return (
    <VStack gap={16}>
      <PageHeader title="集計レポート" sub="売上の俯瞰" />

      <Tabs
        value={tab}
        onChange={(v) => setTab(v as "sales" | "pl" | "target")}
        items={[
          { value: "sales", label: "売上集計" },
          { value: "pl", label: "月次損益" },
          { value: "target", label: "売上目標" },
        ]}
      />

      {tab === "sales" && (
        <VStack gap={16}>
          <Kpis>
            <Kpi label="本日売上" value={`¥${totals.todayTotal.toLocaleString()}`} sub={`${totals.todayCount}件`} />
            <Kpi label="今月売上" value={`¥${totals.monthTotal.toLocaleString()}`} sub={`${totals.monthCount}件`} />
            <Kpi label="月次客単価" value={`¥${totals.monthAvg.toLocaleString()}`} />
            <Kpi label="日次平均" value={`¥${totals.dailyAvg.toLocaleString()}`} />
          </Kpis>

          <Panel
            title="日次推移 (直近30日)"
            action={<Btn onClick={exportTodayPDF}><FileDown size={14}/> 本日PDF</Btn>}
          >
            {last30.every(d => d.total === 0) ? <Empty>記録がありません</Empty> : (
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${last30.length}, 1fr)`, gap: 2, alignItems: "end", height: 160 }}>
                {last30.map(d => (
                  <div key={d.date} style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end" }} title={`${d.date}: ¥${d.total.toLocaleString()}`}>
                    <div style={{ background: d.total > 0 ? "var(--v2-text)" : "var(--v2-border)", height: `${(d.total / maxBar) * 100}%`, minHeight: 1, borderRadius: 1 }} />
                  </div>
                ))}
              </div>
            )}
            <div className="v2-row v2-mute" style={{ fontSize: 10, marginTop: 6, gap: 0 }}>
              <span>{last30[0].date}</span>
              <span style={{ marginLeft: "auto" }}>{last30[last30.length - 1].date}</span>
            </div>
          </Panel>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            <Panel title="PDF出力" action={<Btn size="sm" onClick={exportMonthPDF}><FileDown size={12}/> 月次</Btn>}>
              <VStack gap={6}>
                <Btn onClick={exportTodayPDF}><FileDown size={14}/> 本日売上レポート</Btn>
                <Btn onClick={exportMonthPDF}><FileDown size={14}/> 月次売上レポート</Btn>
                <Btn><Link href="/k4z8qm3x/sales"><ArrowRight size={14}/> 売上管理(期間自由)</Link></Btn>
              </VStack>
            </Panel>

            <Panel title="関連">
              <VStack gap={6}>
                <Btn><Link href="/k4z8qm3x/sales">売上管理 詳細</Link></Btn>
                <Btn><Link href="/k4z8qm3x/chip-flow">チップフロー</Link></Btn>
                <Btn><Link href="/k4z8qm3x/closing">締め処理</Link></Btn>
              </VStack>
            </Panel>
          </div>
        </VStack>
      )}

      {tab === "pl" && (
        <VStack gap={16}>
          <Panel title="対象月">
            <HStack gap={12}>
              <Btn size="sm" onClick={() => setPlMonth(m => addMonths(m, -1))}>← 前月</Btn>
              <div className="v2-h2" style={{ minWidth: 100, textAlign: "center" }}>{formatMonthLabel(plMonth)}</div>
              <Btn size="sm" onClick={() => setPlMonth(m => addMonths(m, 1))}>次月 →</Btn>
              {plMonth !== new Date().toISOString().slice(0, 7) && (
                <Btn size="xs" variant="ghost" onClick={() => setPlMonth(new Date().toISOString().slice(0, 7))}>今月に戻す</Btn>
              )}
            </HStack>
          </Panel>

          <Kpis>
            <Kpi label="月間売上" value={`¥${currentPL.sales.toLocaleString()}`} />
            <Kpi label="変動費目安(原価)" value={`¥${currentPL.cost.toLocaleString()}`} sub={currentPL.hasMissingCost ? "原価未設定の商品あり" : undefined} />
            <Kpi label="固定費合計" value={`¥${currentPL.fixedCost.toLocaleString()}`} />
            <Kpi
              label="粗利"
              value={<span className={currentPL.grossProfit >= 0 ? "v2-amount-pos" : "v2-amount-neg"}>¥{currentPL.grossProfit.toLocaleString()}</span>}
            />
          </Kpis>

          <Panel title="営業利益目安 (粗利 − 固定費)">
            <div
              className={currentPL.operatingProfit >= 0 ? "v2-amount-pos" : "v2-amount-neg"}
              style={{ fontSize: 40, fontWeight: 800, textAlign: "center", padding: "12px 0" }}
            >
              {currentPL.operatingProfit >= 0 ? "+" : ""}¥{currentPL.operatingProfit.toLocaleString()}
            </div>
            {currentPL.hasMissingCost && (
              <div className="v2-mute" style={{ fontSize: 11, textAlign: "center" }}>
                ※原価が未設定の商品があるため、変動費は実際より少なく算出されている可能性があります
              </div>
            )}
          </Panel>

          <Panel title="固定費設定">
            <VStack gap={6}>
              {fixedCosts.map(c => (
                <HStack key={c.id} gap={6}>
                  <input value={c.name} onChange={(e) => updateFixedCost(c.id, { name: e.target.value })} placeholder="項目名" style={{ flex: 1 }} />
                  <span className="v2-mute" style={{ fontSize: 12 }}>¥</span>
                  <input inputMode="numeric" value={c.amount} onChange={(e) => updateFixedCostAmount(c.id, e.target.value)} style={{ width: 120, textAlign: "right" }} />
                  <span className="v2-mute" style={{ fontSize: 12 }}>/月</span>
                  <Btn size="xs" variant="danger" onClick={() => removeFixedCost(c.id)}><X size={11} /></Btn>
                </HStack>
              ))}
              <Btn size="sm" onClick={addFixedCost}><Plus size={12} /> 固定費項目を追加</Btn>
            </VStack>
          </Panel>

          <Panel title="月次内訳 (直近6ヶ月)">
            {last6MonthsPL.every(m => m.sales === 0 && m.cost === 0) ? <Empty>記録がありません</Empty> : (
              <div className="v2-table-wrap">
                <table className="v2-table">
                  <thead>
                    <tr>
                      <th>月</th>
                      <th className="v2-num-cell">売上</th>
                      <th className="v2-num-cell">原価</th>
                      <th className="v2-num-cell">固定費</th>
                      <th className="v2-num-cell">営業利益目安</th>
                    </tr>
                  </thead>
                  <tbody>
                    {last6MonthsPL.map(m => (
                      <tr key={m.month}>
                        <td>{formatMonthLabel(m.month)}</td>
                        <td className="v2-num-cell">¥{m.sales.toLocaleString()}</td>
                        <td className="v2-num-cell">¥{m.cost.toLocaleString()}</td>
                        <td className="v2-num-cell">¥{m.fixedCost.toLocaleString()}</td>
                        <td className={`v2-num-cell ${m.operatingProfit >= 0 ? "v2-amount-pos" : "v2-amount-neg"}`} style={{ fontWeight: 700 }}>
                          {m.operatingProfit >= 0 ? "+" : ""}¥{m.operatingProfit.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel title="利益推移 (直近6ヶ月)">
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${last6MonthsPL.length}, 1fr)`, gap: 8, alignItems: "center", height: 140 }}>
              {last6MonthsPL.map(m => {
                const heightPct = (Math.abs(m.operatingProfit) / maxPLBar) * 45; // 上下に振れるので基準線から最大45%
                const isPositive = m.operatingProfit >= 0;
                return (
                  <div key={m.month} style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }} title={`${formatMonthLabel(m.month)}: ${isPositive ? "+" : ""}¥${m.operatingProfit.toLocaleString()}`}>
                    <div style={{ position: "relative", height: "100%" }}>
                      <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "var(--v2-border)" }} />
                      <div
                        style={{
                          position: "absolute", left: "50%", transform: "translateX(-50%)", width: "60%",
                          [isPositive ? "bottom" : "top"]: "50%",
                          height: `${Math.max(heightPct, 1)}%`,
                          background: isPositive ? "var(--v2-success)" : "var(--v2-danger)",
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${last6MonthsPL.length}, 1fr)`, gap: 8, marginTop: 4 }}>
              {last6MonthsPL.map(m => (
                <div key={m.month} className="v2-mute" style={{ fontSize: 10, textAlign: "center" }}>{m.month.slice(2)}</div>
              ))}
            </div>
          </Panel>

          <div className="v2-mute" style={{ fontSize: 11, textAlign: "center" }}>
            ※あくまで簡易計算です(人件費実績・税は含みません)
          </div>
        </VStack>
      )}

      {tab === "target" && (
        <VStack gap={16}>
          <Banner variant="info">
            達成率・実績はすべて入金済み売上ベースです。後払い(売掛)の未回収分は実績に含みません。
          </Banner>

          <Panel title="今月の予実">
            <Kpis>
              <Kpi label="月間目標" value={`¥${salesTargetStatus.monthTarget.toLocaleString()}`} />
              <Kpi label="実績(月初〜本日)" value={`¥${salesTargetStatus.monthActual.toLocaleString()}`} />
              <Kpi
                label="達成率"
                value={salesTargetStatus.monthTarget > 0 ? <RateChip rate={salesTargetStatus.monthRate} /> : "目標未設定"}
              />
              <Kpi label="残り必要額" value={`¥${salesTargetStatus.remaining.toLocaleString()}`} />
            </Kpis>
            {salesTargetStatus.monthTarget > 0 && (
              <div style={{ marginTop: 12 }}>
                <RateBar rate={salesTargetStatus.monthRate} />
              </div>
            )}
            <div className="v2-mute" style={{ fontSize: 11, marginTop: 10 }}>
              このペースでの着地見込み: ¥{salesTargetStatus.projectedTotal.toLocaleString()}
              (日商平均 ¥{Math.round(salesTargetStatus.elapsedDays > 0 ? salesTargetStatus.monthActual / salesTargetStatus.elapsedDays : 0).toLocaleString()} × {salesTargetStatus.totalDays}日)
            </div>
          </Panel>

          <Panel title="本日の予実">
            <Kpis>
              <Kpi label="日商目標" value={`¥${salesTargetStatus.dayTarget.toLocaleString()}`} />
              <Kpi label="本日実績" value={`¥${salesTargetStatus.todayActual.toLocaleString()}`} />
              <Kpi
                label="達成率"
                value={salesTargetStatus.dayTarget > 0 ? <RateChip rate={salesTargetStatus.dayRate} /> : "目標未設定"}
              />
            </Kpis>
            {salesTargetStatus.dayTarget > 0 && (
              <div style={{ marginTop: 12 }}>
                <RateBar rate={salesTargetStatus.dayRate} />
              </div>
            )}
          </Panel>

          <Panel title="目標設定">
            <VStack gap={12}>
              <HStack gap={12}>
                <Btn size="sm" onClick={() => setTargetEditMonth(m => addMonths(m, -1))}>← 前月</Btn>
                <div className="v2-h2" style={{ minWidth: 100, textAlign: "center" }}>{formatMonthLabel(targetEditMonth)}</div>
                <Btn size="sm" onClick={() => setTargetEditMonth(m => addMonths(m, 1))}>次月 →</Btn>
                {targetEditMonth !== new Date().toISOString().slice(0, 7) && (
                  <Btn size="xs" variant="ghost" onClick={() => setTargetEditMonth(new Date().toISOString().slice(0, 7))}>今月に戻す</Btn>
                )}
              </HStack>
              <HStack gap={16} style={{ flexWrap: "wrap" }}>
                <Field label="月間売上目標(円)">
                  <input
                    inputMode="numeric"
                    value={editingTarget.monthlyTarget}
                    onChange={(e) => updateTargetMonthly(e.target.value)}
                    style={{ width: 160, textAlign: "right" }}
                  />
                </Field>
                <Field label="日商目標(円)">
                  <input
                    inputMode="numeric"
                    value={editingTarget.dailyTarget}
                    onChange={(e) => updateTargetDaily(e.target.value)}
                    style={{ width: 160, textAlign: "right" }}
                  />
                </Field>
              </HStack>
            </VStack>
          </Panel>

          <Panel title="達成率推移 (直近6ヶ月)">
            {salesTargetTrend.every(m => m.target === 0 && m.actual === 0) ? <Empty>記録がありません</Empty> : (
              <div className="v2-table-wrap">
                <table className="v2-table">
                  <thead>
                    <tr>
                      <th>月</th>
                      <th className="v2-num-cell">目標</th>
                      <th className="v2-num-cell">実績</th>
                      <th className="v2-num-cell">達成率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesTargetTrend.map(m => (
                      <tr key={m.month}>
                        <td>{formatMonthLabel(m.month)}</td>
                        <td className="v2-num-cell">¥{m.target.toLocaleString()}</td>
                        <td className="v2-num-cell">¥{m.actual.toLocaleString()}</td>
                        <td className="v2-num-cell">{m.rate !== null ? <RateChip rate={m.rate} /> : <span className="v2-mute">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </VStack>
      )}
    </VStack>
  );
}
