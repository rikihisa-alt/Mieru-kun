"use client";

import { useState, useMemo, useEffect } from "react";
import { usePersisted } from "@/lib/persist/store";
import { salesOrderStore, type SalesOrder } from "@/lib/v2/stores";
import { PageHeader, Panel, VStack, HStack, Kpis, Kpi, Tabs, Empty, Btn, Field, Modal, Chip } from "@/components/v2/ui";
import { FileDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { printDoc, tableHtml, kpisHtml, sectionHtml } from "@/lib/v2/pdf";
import { toCsv, downloadCsv } from "@/lib/v2/csv";

const PAY_LABEL: Record<string, string> = { cash: "現金", card: "カード", qr: "QR", credit: "後払い" };

type Range = "today" | "7d" | "month" | "custom";
type MainTab = "summary" | "unpaid";

function today() { return new Date().toISOString().slice(0, 10); }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }
function startOfMonth() { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); }
function elapsedDays(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export default function SalesPage() {
  const [orders, setOrders] = usePersisted(salesOrderStore);
  const [mainTab, setMainTab] = useState<MainTab>("summary");
  const [range, setRange] = useState<Range>("today");
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [settling, setSettling] = useState<SalesOrder | null>(null);
  const [payMethod, setPayMethod] = useState<"cash" | "card" | "qr">("cash");

  // ダッシュボード等から /v2/sales?tab=unpaid で遷移してきた場合、未払いタブを開く
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "unpaid") setMainTab("unpaid");
  }, []);

  const unpaidOrders = useMemo(
    () => orders.filter(o => o.status === "settled" && o.paymentMethod === "credit" && o.unpaid)
      .sort((a, b) => (a.settledAt ?? a.createdAt).localeCompare(b.settledAt ?? b.createdAt)),
    [orders]
  );
  const unpaidTotal = unpaidOrders.reduce((s, o) => s + o.total, 0);

  function openWriteOff(o: SalesOrder) { setSettling(o); setPayMethod("cash"); }
  function confirmWriteOff() {
    if (!settling) return;
    const now = new Date().toISOString();
    setOrders(prev => prev.map(o => o.id === settling.id ? { ...o, unpaid: false, paidAt: now, paidMethod: payMethod } : o));
    setSettling(null);
  }

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

  // 後払い(credit)は売掛金であり現金売上には含めない。入金済み(現金/カード/QR)のみを「売上」として集計する
  const paidFiltered = useMemo(() => filtered.filter(o => o.paymentMethod !== "credit"), [filtered]);
  const creditFiltered = useMemo(() => filtered.filter(o => o.paymentMethod === "credit"), [filtered]);

  const total = paidFiltered.reduce((s, o) => s + o.total, 0);
  const cash = paidFiltered.filter(o => o.paymentMethod === "cash").reduce((s, o) => s + o.total, 0);
  const card = paidFiltered.filter(o => o.paymentMethod === "card").reduce((s, o) => s + o.total, 0);
  const qr = paidFiltered.filter(o => o.paymentMethod === "qr").reduce((s, o) => s + o.total, 0);
  const creditIssuedTotal = creditFiltered.reduce((s, o) => s + o.total, 0);

  // 日次推移 (入金済みのみ)
  const byDate = useMemo(() => {
    const m = new Map<string, { date: string; total: number; count: number }>();
    paidFiltered.forEach(o => {
      const d = (o.settledAt ?? o.createdAt).slice(0, 10);
      if (!m.has(d)) m.set(d, { date: d, total: 0, count: 0 });
      const ent = m.get(d)!;
      ent.total += o.total; ent.count += 1;
    });
    return Array.from(m.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [paidFiltered]);

  // 商品別 (入金済みのみ)
  const byProduct = useMemo(() => {
    const m = new Map<string, { name: string; qty: number; total: number }>();
    paidFiltered.forEach(o => o.items.forEach(i => {
      const ex = m.get(i.name) ?? { name: i.name, qty: 0, total: 0 };
      ex.qty += i.qty; ex.total += i.price * i.qty;
      m.set(i.name, ex);
    }));
    return Array.from(m.values()).sort((a, b) => b.total - a.total);
  }, [paidFiltered]);

  function exportPDF() {
    const body = kpisHtml([
      { label: "売上合計(入金済)", value: `¥${total.toLocaleString()}` },
      { label: "件数", value: `${paidFiltered.length}件` },
      { label: "客単価", value: `¥${paidFiltered.length > 0 ? Math.round(total / paidFiltered.length).toLocaleString() : 0}` },
      { label: "期間", value: dateRange.from === dateRange.to ? dateRange.from : `${dateRange.from} ~ ${dateRange.to}` },
    ])
    + sectionHtml("支払方法別",
      tableHtml(["方法", "金額", "件数", "構成比"],
        [
          ["現金", `¥${cash.toLocaleString()}`, String(paidFiltered.filter(o => o.paymentMethod === "cash").length), total > 0 ? `${Math.round(cash/total*100)}%` : "—"],
          ["カード", `¥${card.toLocaleString()}`, String(paidFiltered.filter(o => o.paymentMethod === "card").length), total > 0 ? `${Math.round(card/total*100)}%` : "—"],
          ["QR", `¥${qr.toLocaleString()}`, String(paidFiltered.filter(o => o.paymentMethod === "qr").length), total > 0 ? `${Math.round(qr/total*100)}%` : "—"],
        ], { numCols: [1, 2, 3] }))
    + sectionHtml("後払い(売掛・現金売上に含まず)",
      tableHtml(["件数", "金額"],
        [[String(creditFiltered.length), `¥${creditIssuedTotal.toLocaleString()}`]], { numCols: [1] }))
    + sectionHtml("日次推移",
      tableHtml(["日付", "売上", "件数"],
        byDate.map(d => [d.date, `¥${d.total.toLocaleString()}`, String(d.count)]), { numCols: [1, 2] }))
    + sectionHtml("商品別",
      tableHtml(["商品", "数量", "売上"],
        byProduct.slice(0, 30).map(p => [p.name, String(p.qty), `¥${p.total.toLocaleString()}`]), { numCols: [1, 2] }));
    printDoc({ title: "売上レポート", subtitle: `${dateRange.from} 〜 ${dateRange.to}`, body, storeName: "てんぽみえるくん" });
  }

  function exportCsv() {
    const headers = ["日時", "顧客", "卓", "商品", "数量", "単価", "金額", "支払方法", "未払い"];
    const csvRows: (string | number)[][] = [];
    filtered.forEach(o => {
      const dt = o.settledAt ?? o.createdAt;
      const payLabel = o.paymentMethod ? PAY_LABEL[o.paymentMethod] ?? o.paymentMethod : "—";
      const unpaidLabel = o.paymentMethod === "credit" ? (o.unpaid ? "未払い" : "入金済") : "—";
      o.items.forEach(i => {
        csvRows.push([dt, o.customer, o.table ?? "", i.name, i.qty, i.price, i.price * i.qty, payLabel, unpaidLabel]);
      });
    });
    const csv = toCsv(headers, csvRows);
    downloadCsv(`売上明細_${dateRange.from}_${dateRange.to}.csv`, csv);
  }

  return (
    <VStack gap={16}>
      <PageHeader
        title="売上管理"
        sub={mainTab === "summary" ? `${dateRange.from} 〜 ${dateRange.to}` : "後払い(未払い)の一覧と消し込み"}
        action={mainTab === "summary" ? (
          <>
            <Btn onClick={exportCsv}><FileDown size={14}/> CSV出力</Btn>
            <Btn onClick={exportPDF}><FileDown size={14}/> PDF出力</Btn>
          </>
        ) : undefined}
      />

      <Tabs value={mainTab} onChange={(v) => setMainTab(v as MainTab)} items={[
        { value: "summary", label: "売上集計" },
        { value: "unpaid", label: `未払い${unpaidOrders.length > 0 ? ` (${unpaidOrders.length})` : ""}` },
      ]} />

      {mainTab === "summary" && (
        <>
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
            <Kpi label="売上合計(入金済)" value={`¥${total.toLocaleString()}`} />
            <Kpi label="件数" value={paidFiltered.length} sub="件" />
            <Kpi label="客単価" value={`¥${paidFiltered.length > 0 ? Math.round(total / paidFiltered.length).toLocaleString() : 0}`} />
            <Kpi label="日次平均" value={`¥${byDate.length > 0 ? Math.round(total / byDate.length).toLocaleString() : 0}`} />
          </Kpis>

          {creditFiltered.length > 0 && (
            <Panel>
              <HStack gap={8} style={{ color: "var(--v2-warn)" }}>
                <AlertTriangle size={16} />
                <span>この期間に発生した後払い(売掛): <strong className="v2-num">{creditFiltered.length}件 ¥{creditIssuedTotal.toLocaleString()}</strong>(上記の売上合計には含まれていません)</span>
                <Btn size="xs" onClick={() => setMainTab("unpaid")} style={{ marginLeft: "auto" }}>未払い一覧へ →</Btn>
              </HStack>
            </Panel>
          )}

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
        </>
      )}

      {mainTab === "unpaid" && (
        <>
          <Kpis>
            <Kpi label="未払い件数" value={unpaidOrders.length} sub="件" />
            <Kpi label="未払い合計" value={`¥${unpaidTotal.toLocaleString()}`} />
          </Kpis>

          <Panel title="未払い一覧">
            {unpaidOrders.length === 0 ? (
              <Empty>
                <CheckCircle2 size={20} className="v2-mute" />
                未払いはありません
              </Empty>
            ) : (
              <table className="v2-table">
                <thead>
                  <tr>
                    <th>顧客(ポーカーネーム)</th>
                    <th>卓</th>
                    <th className="v2-num-cell">金額</th>
                    <th>発生日</th>
                    <th className="v2-num-cell">経過日数</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {unpaidOrders.map(o => {
                    const occurred = o.settledAt ?? o.createdAt;
                    const days = elapsedDays(occurred);
                    return (
                      <tr key={o.id}>
                        <td>
                          {o.customer}
                          {!o.customerId && <Chip variant="warn">ゲスト(顧客未紐付)</Chip>}
                        </td>
                        <td>{o.table ?? <span className="v2-mute">—</span>}</td>
                        <td className="v2-num-cell">¥{o.total.toLocaleString()}</td>
                        <td className="v2-num v2-sub">{occurred.slice(0, 10)}</td>
                        <td className="v2-num-cell">
                          {days >= 14 ? <Chip variant="danger">{days}日</Chip> : days >= 7 ? <Chip variant="warn">{days}日</Chip> : `${days}日`}
                        </td>
                        <td><Btn size="xs" variant="primary" onClick={() => openWriteOff(o)}>消し込み</Btn></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Panel>
        </>
      )}

      {/* 消し込み */}
      <Modal
        open={!!settling}
        onClose={() => setSettling(null)}
        title="未払いの消し込み"
        footer={<><Btn onClick={() => setSettling(null)}>キャンセル</Btn><Btn variant="primary" onClick={confirmWriteOff}>入金を記録して消し込む</Btn></>}
      >
        {settling && (
          <VStack gap={16}>
            <div>
              <div className="v2-mute" style={{ fontSize: 12 }}>顧客</div>
              <div style={{ fontSize: 16 }}>{settling.customer}</div>
            </div>
            <div>
              <div className="v2-mute" style={{ fontSize: 12 }}>未払い金額</div>
              <div className="v2-num" style={{ fontSize: 28, fontWeight: 600 }}>¥{settling.total.toLocaleString()}</div>
            </div>
            <Field label="入金方法">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                {(["cash", "card", "qr"] as const).map(m => (
                  <button key={m} onClick={() => setPayMethod(m)} className={`v2-btn ${payMethod === m ? "v2-btn-primary" : ""}`}>
                    {m === "cash" ? "現金" : m === "card" ? "カード" : "QR"}
                  </button>
                ))}
              </div>
            </Field>
            <div className="v2-mute" style={{ fontSize: 11 }}>※ 消し込み後、この注文は未払いリストから外れ、入金方法とともに記録されます</div>
          </VStack>
        )}
      </Modal>
    </VStack>
  );
}
