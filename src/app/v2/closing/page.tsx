"use client";

import { useState, useMemo } from "react";
import { usePersisted, usePersistedState } from "@/lib/persist/store";
import { salesOrderStore } from "@/lib/v2/stores";
import { PageHeader, Panel, VStack, Btn, Field, Kpis, Kpi } from "@/components/v2/ui";
import { printDoc, kpisHtml, tableHtml, sectionHtml } from "@/lib/v2/pdf";
import { FileDown, Lock, CheckCircle } from "lucide-react";

interface ClosingRecord {
  date: string;
  notes: string;
  total: number;
  cash: number;
  card: number;
  qr: number;
  count: number;
  closedAt: string;
}

export default function ClosingPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [orders] = usePersisted(salesOrderStore);
  const [closings, setClosings] = usePersistedState<ClosingRecord[]>("v2_closings_v1", []);
  const [notes, setNotes] = useState("");

  const todayData = useMemo(() => {
    const settled = orders.filter(o => o.status === "settled" && (o.settledAt ?? o.createdAt).startsWith(today));
    const cash = settled.filter(o => o.paymentMethod === "cash").reduce((s, o) => s + o.total, 0);
    const card = settled.filter(o => o.paymentMethod === "card").reduce((s, o) => s + o.total, 0);
    const qr = settled.filter(o => o.paymentMethod === "qr").reduce((s, o) => s + o.total, 0);
    return { total: cash + card + qr, cash, card, qr, count: settled.length, orders: settled };
  }, [orders, today]);

  const alreadyClosed = closings.some(c => c.date === today);
  const unsettled = orders.filter(o => o.status === "active").length;

  function execute() {
    if (alreadyClosed) { alert("本日の締めはすでに実行済みです"); return; }
    if (unsettled > 0 && !confirm(`未精算が${unsettled}件あります。締めますか？`)) return;
    const record: ClosingRecord = {
      date: today, notes,
      total: todayData.total, cash: todayData.cash, card: todayData.card, qr: todayData.qr,
      count: todayData.count, closedAt: new Date().toISOString(),
    };
    setClosings(prev => [record, ...prev]);
    setNotes("");
  }

  function exportPDF(record: ClosingRecord) {
    const body = kpisHtml([
      { label: "対象日", value: record.date },
      { label: "売上合計", value: `¥${record.total.toLocaleString()}` },
      { label: "件数", value: `${record.count}件` },
      { label: "締め時刻", value: new Date(record.closedAt).toLocaleString("ja-JP") },
    ])
    + sectionHtml("支払方法別",
      tableHtml(["方法", "金額"],
        [
          ["現金", `¥${record.cash.toLocaleString()}`],
          ["カード", `¥${record.card.toLocaleString()}`],
          ["QR", `¥${record.qr.toLocaleString()}`],
          ["合計", `¥${record.total.toLocaleString()}`],
        ], { numCols: [1] }))
    + (record.notes ? sectionHtml("締めメモ", `<div style="padding:8px;border:1px solid #e5e5e5;background:#fafafa">${record.notes}</div>`) : "");
    printDoc({ title: "締め処理レポート", subtitle: record.date, body, storeName: "てんぽみえるくん" });
  }

  return (
    <VStack gap={16}>
      <PageHeader title="締め処理" sub={today} />

      <Kpis>
        <Kpi label="本日売上" value={`¥${todayData.total.toLocaleString()}`} sub={`${todayData.count}件`} />
        <Kpi label="現金" value={`¥${todayData.cash.toLocaleString()}`} />
        <Kpi label="カード" value={`¥${todayData.card.toLocaleString()}`} />
        <Kpi label="QR" value={`¥${todayData.qr.toLocaleString()}`} />
      </Kpis>

      <Panel title={alreadyClosed ? "本日の締め" : "本日の締めを実行"}>
        {alreadyClosed ? (
          <VStack gap={12}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--v2-success)" }}>
              <CheckCircle size={18}/> 本日の締め処理は完了しています
            </div>
            <Btn onClick={() => exportPDF(closings.find(c => c.date === today)!)}><FileDown size={14}/> 締めPDFを出力</Btn>
          </VStack>
        ) : (
          <VStack gap={12}>
            {unsettled > 0 && (
              <div style={{ padding: 10, background: "var(--v2-warn-bg)", color: "var(--v2-warn)", fontSize: 12, borderRadius: 3 }}>
                未精算の注文が {unsettled} 件あります
              </div>
            )}
            <Field label="締めメモ"><textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="差異 / 特記事項" /></Field>
            <Btn variant="primary" onClick={execute}><Lock size={14}/> 締め処理を実行</Btn>
          </VStack>
        )}
      </Panel>

      {closings.length > 0 && (
        <Panel title="締め履歴">
          <table className="v2-table">
            <thead><tr><th>日付</th><th className="v2-num-cell">売上</th><th className="v2-num-cell">件数</th><th>締め時刻</th><th></th></tr></thead>
            <tbody>
              {closings.slice(0, 30).map(c => (
                <tr key={c.date}>
                  <td className="v2-num">{c.date}</td>
                  <td className="v2-num-cell">¥{c.total.toLocaleString()}</td>
                  <td className="v2-num-cell">{c.count}</td>
                  <td className="v2-sub v2-num">{new Date(c.closedAt).toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                  <td><Btn size="xs" onClick={() => exportPDF(c)}><FileDown size={11}/> PDF</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </VStack>
  );
}
