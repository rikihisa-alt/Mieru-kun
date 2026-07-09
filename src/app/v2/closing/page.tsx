"use client";

import { useState, useMemo } from "react";
import { usePersisted, usePersistedState } from "@/lib/persist/store";
import { salesOrderStore } from "@/lib/v2/stores";
import { PageHeader, Panel, VStack, HStack, Btn, Field, Kpis, Kpi } from "@/components/v2/ui";
import { printDoc, kpisHtml, tableHtml, sectionHtml } from "@/lib/v2/pdf";
import { FileDown, Lock, CheckCircle, Wallet } from "lucide-react";

interface ClosingRecord {
  date: string;
  notes: string;
  total: number;
  cash: number;
  card: number;
  qr: number;
  count: number;
  closedAt: string;
  creditCount?: number; // 本日発生の未払い(後払い)件数 ※現金照合の対象外
  credit?: number;      // 同 金額
  releaseFloat?: number; // 開店時レジ金(釣銭準備金)
  actualCash?: number;   // 実際のレジ内現金(実査額)
  cashDiff?: number;     // 過不足 = 実査額 - 理論値
}

// ===== 全角→半角数字変換 + 数字以外を除去 =====
function toHalfWidthDigits(input: string): string {
  return input
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[^\d]/g, "");
}

export default function ClosingPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [orders] = usePersisted(salesOrderStore);
  const [closings, setClosings] = usePersistedState<ClosingRecord[]>("v2_closings_v1", []);
  const [notes, setNotes] = useState("");
  const [releaseFloatStr, setReleaseFloatStr] = usePersistedState<string>(`v2_register_float_v1_${today}`, "");
  const [actualCashStr, setActualCashStr] = useState("");
  const releaseFloat = Number(releaseFloatStr) || 0;
  const actualCash = Number(actualCashStr) || 0;

  const todayData = useMemo(() => {
    const settled = orders.filter(o => o.status === "settled" && (o.settledAt ?? o.createdAt).startsWith(today));
    // 現金/カード/QRのみを現金照合対象の売上として集計する。後払い(売掛)は含めない
    const paid = settled.filter(o => o.paymentMethod !== "credit");
    const cash = paid.filter(o => o.paymentMethod === "cash").reduce((s, o) => s + o.total, 0);
    const card = paid.filter(o => o.paymentMethod === "card").reduce((s, o) => s + o.total, 0);
    const qr = paid.filter(o => o.paymentMethod === "qr").reduce((s, o) => s + o.total, 0);
    const creditOrders = settled.filter(o => o.paymentMethod === "credit");
    const credit = creditOrders.reduce((s, o) => s + o.total, 0);
    return { total: cash + card + qr, cash, card, qr, count: paid.length, orders: paid, creditCount: creditOrders.length, credit };
  }, [orders, today]);

  const alreadyClosed = closings.some(c => c.date === today);
  const unsettled = orders.filter(o => o.status === "active").length;

  // 理論値 = 開店時レジ金(釣銭準備金) + 本日現金売上
  const theoreticalCash = releaseFloat + todayData.cash;
  // 過不足 = 実査額 - 理論値
  const cashDiff = actualCash - theoreticalCash;
  const hasActualInput = actualCashStr.trim() !== "";

  function execute() {
    if (alreadyClosed) { alert("本日の締めはすでに実行済みです"); return; }
    if (unsettled > 0 && !confirm(`未精算が${unsettled}件あります。締めますか？`)) return;
    if (hasActualInput && cashDiff !== 0 && !confirm(`現金過不足が¥${Math.abs(cashDiff).toLocaleString()}あります。このまま締めますか?`)) return;
    const record: ClosingRecord = {
      date: today, notes,
      total: todayData.total, cash: todayData.cash, card: todayData.card, qr: todayData.qr,
      count: todayData.count, closedAt: new Date().toISOString(),
      creditCount: todayData.creditCount, credit: todayData.credit,
      releaseFloat, actualCash: hasActualInput ? actualCash : undefined,
      cashDiff: hasActualInput ? cashDiff : undefined,
    };
    setClosings(prev => [record, ...prev]);
    setNotes("");
    setActualCashStr("");
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
    + ((record.creditCount ?? 0) > 0 ? sectionHtml("本日発生の未払い(後払い・現金照合対象外)",
      tableHtml(["件数", "金額"], [[String(record.creditCount), `¥${(record.credit ?? 0).toLocaleString()}`]], { numCols: [1] })) : "")
    + (record.releaseFloat != null || record.actualCash != null ? sectionHtml("レジ金・釣銭管理",
      tableHtml(["項目", "金額"], [
        ["開店時レジ金(釣銭準備金)", `¥${(record.releaseFloat ?? 0).toLocaleString()}`],
        ["理論値(準備金+現金売上)", `¥${((record.releaseFloat ?? 0) + record.cash).toLocaleString()}`],
        ["実際のレジ内現金(実査額)", record.actualCash != null ? `¥${record.actualCash.toLocaleString()}` : "—"],
        ["過不足", record.cashDiff != null ? `${record.cashDiff === 0 ? "±0" : (record.cashDiff > 0 ? "+" : "")}¥${record.cashDiff.toLocaleString()}` : "—"],
      ], { numCols: [1] })) : "")
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

      {todayData.creditCount > 0 && (
        <Panel>
          <HStack gap={8} style={{ color: "var(--v2-warn)" }}>
            <Wallet size={16} />
            <span>
              本日発生の未払い(後払い): <strong className="v2-num">{todayData.creditCount}件 ¥{todayData.credit.toLocaleString()}</strong>
            </span>
            <span className="v2-mute" style={{ fontSize: 12, marginLeft: "auto" }}>※ 現金照合の対象外です</span>
          </HStack>
        </Panel>
      )}

      <Panel title="レジ金・釣銭管理">
        <VStack gap={12}>
          <HStack gap={16} style={{ flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px" }}>
              <Field label="開店時レジ金(釣銭準備金)">
                <input
                  inputMode="numeric"
                  value={releaseFloatStr}
                  onChange={(e) => setReleaseFloatStr(toHalfWidthDigits(e.target.value))}
                  placeholder="例: 50000"
                  disabled={alreadyClosed}
                />
              </Field>
            </div>
            <div style={{ flex: "1 1 200px" }}>
              <Field label="実際のレジ内現金(実査額)">
                <input
                  inputMode="numeric"
                  value={actualCashStr}
                  onChange={(e) => setActualCashStr(toHalfWidthDigits(e.target.value))}
                  placeholder="例: 123456"
                  disabled={alreadyClosed}
                />
              </Field>
            </div>
          </HStack>
          <Kpis>
            <Kpi label="理論値(準備金+現金売上)" value={`¥${theoreticalCash.toLocaleString()}`} />
            <Kpi
              label="過不足(実査額-理論値)"
              value={hasActualInput ? `${cashDiff === 0 ? "±0" : (cashDiff > 0 ? "+" : "")}¥${cashDiff.toLocaleString()}` : "—"}
            />
          </Kpis>
          {hasActualInput && (
            cashDiff === 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 10, background: "var(--v2-success-bg)", color: "var(--v2-success)", fontSize: 12, borderRadius: 3 }}>
                <CheckCircle size={16} /> 過不足なし
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 10, background: cashDiff > 0 ? "var(--v2-warn-bg)" : "var(--v2-danger-bg)", color: cashDiff > 0 ? "var(--v2-warn)" : "var(--v2-danger)", fontSize: 12, borderRadius: 3 }}>
                <Wallet size={16} /> {cashDiff > 0 ? "過剰" : "不足"}: ¥{Math.abs(cashDiff).toLocaleString()}
              </div>
            )
          )}
        </VStack>
      </Panel>

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
            <thead><tr><th>日付</th><th className="v2-num-cell">売上</th><th className="v2-num-cell">件数</th><th className="v2-num-cell">過不足</th><th>締め時刻</th><th></th></tr></thead>
            <tbody>
              {closings.slice(0, 30).map(c => (
                <tr key={c.date}>
                  <td className="v2-num">{c.date}</td>
                  <td className="v2-num-cell">¥{c.total.toLocaleString()}</td>
                  <td className="v2-num-cell">{c.count}</td>
                  <td className="v2-num-cell" style={c.cashDiff ? { color: c.cashDiff > 0 ? "var(--v2-warn)" : "var(--v2-danger)" } : undefined}>
                    {c.cashDiff != null ? `${c.cashDiff === 0 ? "±0" : (c.cashDiff > 0 ? "+" : "")}¥${c.cashDiff.toLocaleString()}` : "—"}
                  </td>
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
