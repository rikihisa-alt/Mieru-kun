"use client";

import { useState, useMemo } from "react";
import { usePersisted } from "@/lib/persist/store";
import { salesOrderStore } from "@/lib/v2/stores";
import { PageHeader, Panel, VStack, Kpis, Kpi, Tabs, Empty, Btn, Field } from "@/components/v2/ui";
import { FileDown } from "lucide-react";
import { printDoc, tableHtml, kpisHtml, sectionHtml } from "@/lib/v2/pdf";

type Range = "today" | "7d" | "month" | "custom";

function today() { return new Date().toISOString().slice(0, 10); }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }
function startOfMonth() { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); }

export default function SalesPage() {
  const [orders] = usePersisted(salesOrderStore);
  const [range, setRange] = useState<Range>("today");
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());

  const dateRange = useMemo(() => {
    if (range === "today") return { from: today(), to: today() };
    if (range === "7d") return { from: daysAgo(6), to: today() };
    if (range === "month") return { from: startOfMonth(), to: today() };
    return { from, to };
  }, [range, from, to]);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (o.status !== "settled") return false;
      const d = (o.settledAt ?? o.createdAt).slice(0, 10);
      return d >= dateRange.from && d <= dateRange.to;
    });
  }, [orders, dateRange]);

  const total = filtered.reduce((s, o) => s + o.total, 0);
  const cash = filtered.filter(o => o.paymentMethod === "cash").reduce((s, o) => s + o.total, 0);
  const card = filtered.filter(o => o.paymentMethod === "card").reduce((s, o) => s + o.total, 0);
  const qr = filtered.filter(o => o.paymentMethod === "qr").reduce((s, o) => s + o.total, 0);

  // 日次推移
  const byDate = useMemo(() => {
    const m = new Map<string, { date: string; total: number; count: number }>();
    filtered.forEach(o => {
      const d = (o.settledAt ?? o.createdAt).slice(0, 10);
      if (!m.has(d)) m.set(d, { date: d, total: 0, count: 0 });
      const ent = m.get(d)!;
      ent.total += o.total; ent.count += 1;
    });
    return Array.from(m.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  // 商品別
  const byProduct = useMemo(() => {
    const m = new Map<string, { name: string; qty: number; total: number }>();
    filtered.forEach(o => o.items.forEach(i => {
      const ex = m.get(i.name) ?? { name: i.name, qty: 0, total: 0 };
      ex.qty += i.qty; ex.total += i.price * i.qty;
      m.set(i.name, ex);
    }));
    return Array.from(m.values()).sort((a, b) => b.total - a.total);
  }, [filtered]);

  function exportPDF() {
    const body = kpisHtml([
      { label: "売上合計", value: `¥${total.toLocaleString()}` },
      { label: "件数", value: `${filtered.length}件` },
      { label: "客単価", value: `¥${filtered.length > 0 ? Math.round(total / filtered.length).toLocaleString() : 0}` },
      { label: "期間", value: dateRange.from === dateRange.to ? dateRange.from : `${dateRange.from} ~ ${dateRange.to}` },
    ])
    + sectionHtml("支払方法別",
      tableHtml(["方法", "金額", "件数", "構成比"],
        [
          ["現金", `¥${cash.toLocaleString()}`, String(filtered.filter(o => o.paymentMethod === "cash").length), total > 0 ? `${Math.round(cash/total*100)}%` : "—"],
          ["カード", `¥${card.toLocaleString()}`, String(filtered.filter(o => o.paymentMethod === "card").length), total > 0 ? `${Math.round(card/total*100)}%` : "—"],
          ["QR", `¥${qr.toLocaleString()}`, String(filtered.filter(o => o.paymentMethod === "qr").length), total > 0 ? `${Math.round(qr/total*100)}%` : "—"],
        ], { numCols: [1, 2, 3] }))
    + sectionHtml("日次推移",
      tableHtml(["日付", "売上", "件数"],
        byDate.map(d => [d.date, `¥${d.total.toLocaleString()}`, String(d.count)]), { numCols: [1, 2] }))
    + sectionHtml("商品別",
      tableHtml(["商品", "数量", "売上"],
        byProduct.slice(0, 30).map(p => [p.name, String(p.qty), `¥${p.total.toLocaleString()}`]), { numCols: [1, 2] }));
    printDoc({ title: "売上レポート", subtitle: `${dateRange.from} 〜 ${dateRange.to}`, body, storeName: "てんぽみえるくん" });
  }

  return (
    <VStack gap={16}>
      <PageHeader
        title="売上管理"
        sub={`${dateRange.from} 〜 ${dateRange.to}`}
        action={<Btn onClick={exportPDF}><FileDown size={14}/> PDF出力</Btn>}
      />

      <Tabs value={range} onChange={(v) => setRange(v as Range)} items={[
        { value: "today", label: "本日" },
        { value: "7d", label: "直近7日" },
        { value: "month", label: "今月" },
        { value: "custom", label: "期間指定" },
      ]} />

      {range === "custom" && (
        <Panel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="From"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
            <Field label="To"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
          </div>
        </Panel>
      )}

      <Kpis>
        <Kpi label="売上合計" value={`¥${total.toLocaleString()}`} />
        <Kpi label="件数" value={filtered.length} sub="件" />
        <Kpi label="客単価" value={`¥${filtered.length > 0 ? Math.round(total / filtered.length).toLocaleString() : 0}`} />
        <Kpi label="日次平均" value={`¥${byDate.length > 0 ? Math.round(total / byDate.length).toLocaleString() : 0}`} />
      </Kpis>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Panel title="支払方法別">
          {total === 0 ? <Empty>データなし</Empty> : (
            <table className="v2-table">
              <tbody>
                <tr><td>現金</td><td className="v2-num-cell">¥{cash.toLocaleString()}</td><td className="v2-num-cell v2-sub">{Math.round(cash/total*100)}%</td></tr>
                <tr><td>カード</td><td className="v2-num-cell">¥{card.toLocaleString()}</td><td className="v2-num-cell v2-sub">{Math.round(card/total*100)}%</td></tr>
                <tr><td>QR</td><td className="v2-num-cell">¥{qr.toLocaleString()}</td><td className="v2-num-cell v2-sub">{Math.round(qr/total*100)}%</td></tr>
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="商品別 (Top10)">
          {byProduct.length === 0 ? <Empty>データなし</Empty> : (
            <table className="v2-table">
              <thead><tr><th>商品</th><th className="v2-num-cell">数</th><th className="v2-num-cell">売上</th></tr></thead>
              <tbody>
                {byProduct.slice(0, 10).map(p => (
                  <tr key={p.name}>
                    <td>{p.name}</td>
                    <td className="v2-num-cell">{p.qty}</td>
                    <td className="v2-num-cell">¥{p.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

      <Panel title="日次推移">
        {byDate.length === 0 ? <Empty>データなし</Empty> : (
          <table className="v2-table">
            <thead><tr><th>日付</th><th className="v2-num-cell">売上</th><th className="v2-num-cell">件数</th><th className="v2-num-cell">客単価</th></tr></thead>
            <tbody>
              {byDate.slice().reverse().map(d => (
                <tr key={d.date}>
                  <td className="v2-num">{d.date}</td>
                  <td className="v2-num-cell">¥{d.total.toLocaleString()}</td>
                  <td className="v2-num-cell">{d.count}</td>
                  <td className="v2-num-cell v2-sub">¥{Math.round(d.total / d.count).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </VStack>
  );
}
