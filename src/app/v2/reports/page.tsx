"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePersisted } from "@/lib/persist/store";
import { salesOrderStore } from "@/lib/v2/stores";
import { PageHeader, Panel, VStack, Kpis, Kpi, Empty, Btn } from "@/components/v2/ui";
import { FileDown, ArrowRight } from "lucide-react";
import { printDoc, tableHtml, kpisHtml, sectionHtml } from "@/lib/v2/pdf";

export default function ReportsPage() {
  const [orders] = usePersisted(salesOrderStore);
  const today = new Date().toISOString().slice(0, 10);
  const monthPrefix = today.slice(0, 7);

  const totals = useMemo(() => {
    const settled = orders.filter(o => o.status === "settled");
    const todayOrders = settled.filter(o => (o.settledAt ?? o.createdAt).startsWith(today));
    const monthOrders = settled.filter(o => (o.settledAt ?? o.createdAt).startsWith(monthPrefix));
    const sum = (xs: typeof orders) => xs.reduce((s, o) => s + o.total, 0);
    return {
      todayTotal: sum(todayOrders), todayCount: todayOrders.length,
      monthTotal: sum(monthOrders), monthCount: monthOrders.length,
      monthAvg: monthOrders.length > 0 ? Math.round(sum(monthOrders) / monthOrders.length) : 0,
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
          o.paymentMethod === "cash" ? "現金" : o.paymentMethod === "card" ? "カード" : "QR",
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

  return (
    <VStack gap={16}>
      <PageHeader title="集計レポート" sub="売上の俯瞰" />

      <Kpis>
        <Kpi label="本日売上" value={`¥${totals.todayTotal.toLocaleString()}`} sub={`${totals.todayCount}件`} />
        <Kpi label="今月売上" value={`¥${totals.monthTotal.toLocaleString()}`} sub={`${totals.monthCount}件`} />
        <Kpi label="月次客単価" value={`¥${totals.monthAvg.toLocaleString()}`} />
        <Kpi label="日次平均" value={`¥${last30.length > 0 ? Math.round(totals.monthTotal / Math.max(1, last30.filter(d => d.total > 0).length)).toLocaleString() : 0}`} />
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Panel title="PDF出力" action={<Btn size="sm" onClick={exportMonthPDF}><FileDown size={12}/> 月次</Btn>}>
          <VStack gap={6}>
            <Btn onClick={exportTodayPDF}><FileDown size={14}/> 本日売上レポート</Btn>
            <Btn onClick={exportMonthPDF}><FileDown size={14}/> 月次売上レポート</Btn>
            <Link href="/v2/sales" className="v2-btn"><ArrowRight size={14}/> 売上管理(期間自由)</Link>
          </VStack>
        </Panel>

        <Panel title="関連">
          <VStack gap={6}>
            <Link href="/v2/sales" className="v2-btn">売上管理 詳細</Link>
            <Link href="/v2/chip-flow" className="v2-btn">チップフロー</Link>
            <Link href="/v2/closing" className="v2-btn">締め処理</Link>
          </VStack>
        </Panel>
      </div>
    </VStack>
  );
}
