"use client";

import { useState, useMemo } from "react";
import { usePersisted, usePersistedState } from "@/lib/persist/store";
import { salesOrderStore, chipFlowStore } from "@/lib/v2/stores";
import { productStore, type ProductCategory } from "@/lib/store/domain-stores";
import { PageHeader, Panel, VStack, HStack, Btn, Field, Kpis, Kpi, Modal, Banner } from "@/components/v2/ui";
import { printDoc, kpisHtml, tableHtml, sectionHtml, escapeHtml } from "@/lib/v2/pdf";
import { FileDown, Lock, CheckCircle, Wallet, FileText, Copy, ClipboardList } from "lucide-react";

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

// ===== 日報 =====
interface DailyReportCategoryRow {
  category: string;
  label: string;
  amount: number;
  qty: number;
}
interface DailyReport {
  date: string;
  weekday: string;
  generatedAt: string;
  fromClosing: boolean; // true=締めデータから生成 / false=現時点集計から生成
  total: number;
  count: number;
  perCustomer: number;
  cash: number;
  card: number;
  qr: number;
  creditCount: number;
  credit: number;
  categories: DailyReportCategoryRow[];
  cashDiff?: number;
  hasCashDiff: boolean;
  chipOut: number; // 貸出(店→客)
  chipIn: number;  // 回収(客→店)
  chipNet: number; // 回収-貸出
  hasChipData: boolean;
  remarks: string;
}

const WEEKDAY_LABEL = ["日", "月", "火", "水", "木", "金", "土"];
const CATEGORY_LABEL: Record<ProductCategory, string> = {
  entrance: "エントランス", drink: "ドリンク", food: "フード",
  tournament_fee: "トナメ参加費", tip_purchase: "チップ購入",
  tip_use: "チップ利用", discount: "割引", adjustment: "調整", other: "その他",
};

// ===== 全角→半角数字変換 + 数字以外を除去 =====
function toHalfWidthDigits(input: string): string {
  return input
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[^\d]/g, "");
}

function fmtYen(n: number): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}¥${Math.abs(n).toLocaleString()}`;
}

export default function ClosingPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [orders] = usePersisted(salesOrderStore);
  const [products] = usePersisted(productStore);
  const [chipEntries] = usePersisted(chipFlowStore);
  const [closings, setClosings] = usePersistedState<ClosingRecord[]>("v2_closings_v1", []);
  const [reports, setReports] = usePersistedState<Record<string, DailyReport>>("v2_daily_reports_v1", {});
  const [notes, setNotes] = useState("");
  const [releaseFloatStr, setReleaseFloatStr] = usePersistedState<string>(`v2_register_float_v1_${today}`, "");
  const [actualCashStr, setActualCashStr] = useState("");
  const releaseFloat = Number(releaseFloatStr) || 0;
  const actualCash = Number(actualCashStr) || 0;

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [previewReport, setPreviewReport] = useState<DailyReport | null>(null);
  const [remarksInput, setRemarksInput] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");

  const productCategoryMap = useMemo(() => {
    const m = new Map<string, ProductCategory>();
    for (const p of products) m.set(p.id, p.category);
    return m;
  }, [products]);

  const todayData = useMemo(() => {
    const settled = orders.filter(o => o.status === "settled" && (o.settledAt ?? o.createdAt).startsWith(today));
    // 現金/カード/QRのみを現金照合対象の売上として集計する。後払い(売掛)は含めない
    const paid = settled.filter(o => o.paymentMethod !== "credit");
    const cash = paid.filter(o => o.paymentMethod === "cash").reduce((s, o) => s + o.total, 0);
    const card = paid.filter(o => o.paymentMethod === "card").reduce((s, o) => s + o.total, 0);
    const qr = paid.filter(o => o.paymentMethod === "qr").reduce((s, o) => s + o.total, 0);
    const creditOrders = settled.filter(o => o.paymentMethod === "credit");
    const credit = creditOrders.reduce((s, o) => s + o.total, 0);
    return { total: cash + card + qr, cash, card, qr, count: paid.length, orders: settled, creditCount: creditOrders.length, credit };
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

  // ===== 日報生成 =====
  function buildCategoryRows(dateStr: string, targetOrders: typeof orders): DailyReportCategoryRow[] {
    const settled = targetOrders.filter(o => o.status === "settled" && (o.settledAt ?? o.createdAt).startsWith(dateStr));
    const agg = new Map<string, { amount: number; qty: number }>();
    for (const o of settled) {
      for (const item of o.items) {
        const cat = productCategoryMap.get(item.productId) ?? (item.category as ProductCategory | undefined) ?? "other";
        const key = String(cat);
        const cur = agg.get(key) ?? { amount: 0, qty: 0 };
        cur.amount += item.price * item.qty;
        cur.qty += item.qty;
        agg.set(key, cur);
      }
    }
    const rows: DailyReportCategoryRow[] = Array.from(agg.entries()).map(([category, v]) => ({
      category,
      label: CATEGORY_LABEL[category as ProductCategory] ?? category,
      amount: v.amount,
      qty: v.qty,
    }));
    rows.sort((a, b) => b.amount - a.amount);
    return rows;
  }

  function buildChipSummary(dateStr: string) {
    const dayEntries = chipEntries.filter(e => e.date === dateStr);
    if (dayEntries.length === 0) return { chipOut: 0, chipIn: 0, chipNet: 0, hasChipData: false };
    let chipOut = 0, chipIn = 0;
    for (const e of dayEntries) {
      const dir = e.flowDirection ?? (e.direction === "in" ? "in" : "out");
      if (dir === "out") chipOut += e.amount;
      else if (dir === "in") chipIn += e.amount;
    }
    return { chipOut, chipIn, chipNet: chipIn - chipOut, hasChipData: true };
  }

  function generateReport(dateStr: string, remarks: string): DailyReport {
    const closingRecord = closings.find(c => c.date === dateStr);
    const isToday = dateStr === today;
    const chip = buildChipSummary(dateStr);
    const weekday = WEEKDAY_LABEL[new Date(`${dateStr}T00:00:00`).getDay()];

    if (closingRecord) {
      const categories = buildCategoryRows(dateStr, orders);
      return {
        date: dateStr, weekday, generatedAt: new Date().toISOString(), fromClosing: true,
        total: closingRecord.total, count: closingRecord.count,
        perCustomer: closingRecord.count > 0 ? Math.round(closingRecord.total / closingRecord.count) : 0,
        cash: closingRecord.cash, card: closingRecord.card, qr: closingRecord.qr,
        creditCount: closingRecord.creditCount ?? 0, credit: closingRecord.credit ?? 0,
        categories,
        cashDiff: closingRecord.cashDiff, hasCashDiff: closingRecord.cashDiff != null,
        ...chip,
        remarks,
      };
    }

    // 未締め: 現時点の集計 (今日のみ想定。過去日で締めが無い場合も現存データから集計)
    const dayData = isToday ? todayData : (() => {
      const settled = orders.filter(o => o.status === "settled" && (o.settledAt ?? o.createdAt).startsWith(dateStr));
      const paid = settled.filter(o => o.paymentMethod !== "credit");
      const cash = paid.filter(o => o.paymentMethod === "cash").reduce((s, o) => s + o.total, 0);
      const card = paid.filter(o => o.paymentMethod === "card").reduce((s, o) => s + o.total, 0);
      const qr = paid.filter(o => o.paymentMethod === "qr").reduce((s, o) => s + o.total, 0);
      const creditOrders = settled.filter(o => o.paymentMethod === "credit");
      return { total: cash + card + qr, cash, card, qr, count: paid.length, creditCount: creditOrders.length, credit: creditOrders.reduce((s, o) => s + o.total, 0) };
    })();
    const categories = buildCategoryRows(dateStr, orders);
    return {
      date: dateStr, weekday, generatedAt: new Date().toISOString(), fromClosing: false,
      total: dayData.total, count: dayData.count,
      perCustomer: dayData.count > 0 ? Math.round(dayData.total / dayData.count) : 0,
      cash: dayData.cash, card: dayData.card, qr: dayData.qr,
      creditCount: dayData.creditCount, credit: dayData.credit,
      categories,
      hasCashDiff: isToday && hasActualInput,
      cashDiff: isToday && hasActualInput ? cashDiff : undefined,
      ...chip,
      remarks,
    };
  }

  function openReportModal(dateStr: string) {
    const existing = reports[dateStr];
    setRemarksInput(existing?.remarks ?? notes ?? "");
    const report = generateReport(dateStr, existing?.remarks ?? notes ?? "");
    setPreviewReport(report);
    setReportModalOpen(true);
    setCopyFeedback("");
  }

  function saveReport() {
    if (!previewReport) return;
    const updated: DailyReport = { ...previewReport, remarks: remarksInput, generatedAt: new Date().toISOString() };
    setReports(prev => ({ ...prev, [updated.date]: updated }));
    setPreviewReport(updated);
    setCopyFeedback("日報を保存しました");
  }

  function reportToPlainText(r: DailyReport): string {
    const lines: string[] = [];
    lines.push(`【営業日報】${r.date}(${r.weekday})`);
    lines.push(r.fromClosing ? "※締め済みデータ" : "※未締め・現時点集計");
    lines.push("");
    lines.push(`総売上: ${fmtYen(r.total)}`);
    lines.push(`来店組数: ${r.count}組`);
    lines.push(`客単価: ${fmtYen(r.perCustomer)}`);
    lines.push("");
    lines.push("■ 支払方法別");
    lines.push(`現金: ${fmtYen(r.cash)}`);
    lines.push(`カード: ${fmtYen(r.card)}`);
    lines.push(`QR: ${fmtYen(r.qr)}`);
    lines.push("");
    if (r.categories.length > 0) {
      lines.push("■ カテゴリ別売上");
      for (const c of r.categories) lines.push(`${c.label}: ${fmtYen(c.amount)} (${c.qty}点)`);
      lines.push("");
    }
    if (r.creditCount > 0) {
      lines.push("■ 未払い(後払い)発生");
      lines.push(`${r.creditCount}件 ${fmtYen(r.credit)}`);
      lines.push("");
    }
    if (r.hasCashDiff) {
      lines.push("■ 現金過不足");
      lines.push(r.cashDiff === 0 ? "±0(過不足なし)" : `${(r.cashDiff ?? 0) > 0 ? "+" : ""}${fmtYen(r.cashDiff ?? 0)}`);
      lines.push("");
    }
    if (r.hasChipData) {
      lines.push("■ チップ収支");
      lines.push(`貸出: ${r.chipOut.toLocaleString()}枚 / 回収: ${r.chipIn.toLocaleString()}枚`);
      lines.push(`収支: ${r.chipNet >= 0 ? "+" : ""}${r.chipNet.toLocaleString()}枚`);
      lines.push("");
    }
    if (r.remarks) {
      lines.push("■ 特記事項");
      lines.push(r.remarks);
      lines.push("");
    }
    lines.push(`(生成: ${new Date(r.generatedAt).toLocaleString("ja-JP")})`);
    return lines.join("\n");
  }

  async function copyReportText() {
    if (!previewReport) return;
    const withRemarks = { ...previewReport, remarks: remarksInput };
    const text = reportToPlainText(withRemarks);
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback("テキストをコピーしました");
    } catch {
      setCopyFeedback("コピーに失敗しました。手動でコピーしてください");
    }
  }

  function exportReportPDF(r: DailyReport) {
    const body = kpisHtml([
      { label: "対象日", value: `${r.date}(${r.weekday})` },
      { label: "総売上", value: fmtYen(r.total) },
      { label: "来店組数", value: `${r.count}組` },
      { label: "客単価", value: fmtYen(r.perCustomer) },
    ])
    + sectionHtml("支払方法別",
      tableHtml(["方法", "金額"], [
        ["現金", fmtYen(r.cash)],
        ["カード", fmtYen(r.card)],
        ["QR", fmtYen(r.qr)],
        ["合計", fmtYen(r.total)],
      ], { numCols: [1] }))
    + (r.categories.length > 0 ? sectionHtml("カテゴリ別売上",
      tableHtml(["カテゴリ", "金額", "点数"], r.categories.map(c => [c.label, fmtYen(c.amount), `${c.qty}点`]), { numCols: [1, 2] })) : "")
    + (r.creditCount > 0 ? sectionHtml("未払い(後払い)発生",
      tableHtml(["件数", "金額"], [[String(r.creditCount), fmtYen(r.credit)]], { numCols: [1] })) : "")
    + (r.hasCashDiff ? sectionHtml("現金過不足",
      tableHtml(["項目", "金額"], [["過不足", r.cashDiff === 0 ? "±0" : `${(r.cashDiff ?? 0) > 0 ? "+" : ""}${fmtYen(r.cashDiff ?? 0)}`]], { numCols: [1] })) : "")
    + (r.hasChipData ? sectionHtml("チップ収支",
      tableHtml(["貸出", "回収", "収支"], [[`${r.chipOut.toLocaleString()}枚`, `${r.chipIn.toLocaleString()}枚`, `${r.chipNet >= 0 ? "+" : ""}${r.chipNet.toLocaleString()}枚`]], { numCols: [0, 1, 2] })) : "")
    + (r.remarks ? sectionHtml("特記事項", `<div style="padding:8px;border:1px solid #e5e5e5;background:#fafafa;white-space:pre-wrap">${escapeHtml(r.remarks)}</div>`) : "");
    printDoc({ title: "営業日報", subtitle: `${r.date}(${r.weekday})${r.fromClosing ? "" : " ※未締め"}`, body, storeName: "てんぽみえるくん" });
  }

  const reportHistory = useMemo(() => {
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - 13);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return Object.values(reports)
      .filter(r => r.date >= cutoffStr && r.date <= today)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [reports, today]);

  return (
    <VStack gap={16}>
      <PageHeader
        title="締め処理"
        sub={today}
        action={<Btn variant="primary" onClick={() => openReportModal(today)}><ClipboardList size={14}/> 日報を生成</Btn>}
      />

      <Kpis>
        <Kpi label="本日売上" value={`¥${todayData.total.toLocaleString()}`} sub={`${todayData.count}件`} />
        <Kpi label="現金" value={`¥${todayData.cash.toLocaleString()}`} />
        <Kpi label="カード" value={`¥${todayData.card.toLocaleString()}`} />
        <Kpi label="QR" value={`¥${todayData.qr.toLocaleString()}`} />
      </Kpis>

      {todayData.creditCount > 0 && (
        <Banner variant="warn" icon={<Wallet size={16} />}>
          本日発生の未払い(後払い): <strong className="v2-num">{todayData.creditCount}件 ¥{todayData.credit.toLocaleString()}</strong>
          <span className="v2-mute" style={{ fontSize: 12, marginLeft: 8 }}>※ 現金照合の対象外です</span>
        </Banner>
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
              <Banner variant="info" icon={<CheckCircle size={16} />}>過不足なし</Banner>
            ) : (
              <Banner variant={cashDiff > 0 ? "warn" : "danger"} icon={<Wallet size={16} />}>
                {cashDiff > 0 ? "過剰" : "不足"}: ¥{Math.abs(cashDiff).toLocaleString()}
              </Banner>
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
            <HStack gap={8}>
              <Btn onClick={() => exportPDF(closings.find(c => c.date === today)!)}><FileDown size={14}/> 締めPDFを出力</Btn>
              <Btn onClick={() => openReportModal(today)}><ClipboardList size={14}/> 日報を生成</Btn>
            </HStack>
          </VStack>
        ) : (
          <VStack gap={12}>
            {unsettled > 0 && (
              <Banner variant="warn">未精算の注文が {unsettled} 件あります</Banner>
            )}
            <Field label="締めメモ"><textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="差異 / 特記事項" /></Field>
            <Btn variant="primary" onClick={execute}><Lock size={14}/> 締め処理を実行</Btn>
          </VStack>
        )}
      </Panel>

      {closings.length > 0 && (
        <Panel title="締め履歴">
          <div className="v2-table-wrap">
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
                    <td>
                      <HStack gap={4}>
                        <Btn size="xs" onClick={() => exportPDF(c)}><FileDown size={11}/> PDF</Btn>
                        <Btn size="xs" onClick={() => openReportModal(c.date)}><ClipboardList size={11}/> 日報</Btn>
                      </HStack>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {reportHistory.length > 0 && (
        <Panel title="日報履歴(直近14日)">
          <div className="v2-table-wrap">
            <table className="v2-table">
              <thead><tr><th>日付</th><th className="v2-num-cell">総売上</th><th className="v2-num-cell">組数</th><th className="v2-num-cell">客単価</th><th>状態</th><th></th></tr></thead>
              <tbody>
                {reportHistory.map(r => (
                  <tr key={r.date}>
                    <td className="v2-num">{r.date}({r.weekday})</td>
                    <td className="v2-num-cell">{fmtYen(r.total)}</td>
                    <td className="v2-num-cell">{r.count}</td>
                    <td className="v2-num-cell">{fmtYen(r.perCustomer)}</td>
                    <td className="v2-sub">{r.fromClosing ? "締め済み" : "未締め"}</td>
                    <td>
                      <Btn size="xs" onClick={() => openReportModal(r.date)}><ClipboardList size={11}/> 表示</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <Modal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title={previewReport ? `営業日報 ${previewReport.date}(${previewReport.weekday})` : "営業日報"}
        size="lg"
        footer={previewReport && (
          <HStack gap={8}>
            {copyFeedback && <span className="v2-mute" style={{ fontSize: 12, marginRight: 8 }}>{copyFeedback}</span>}
            <Btn onClick={copyReportText}><Copy size={14}/> テキストをコピー</Btn>
            <Btn onClick={() => exportReportPDF({ ...previewReport, remarks: remarksInput })}><FileDown size={14}/> PDF出力</Btn>
            <Btn variant="primary" onClick={saveReport}><FileText size={14}/> 保存</Btn>
          </HStack>
        )}
      >
        {previewReport && (
          <VStack gap={14}>
            <div className="v2-mute" style={{ fontSize: 12 }}>
              {previewReport.fromClosing ? "締め済みデータから生成" : "未締め・現時点の集計から生成"}
            </div>
            <Kpis>
              <Kpi label="総売上" value={fmtYen(previewReport.total)} />
              <Kpi label="来店組数" value={`${previewReport.count}組`} />
              <Kpi label="客単価" value={fmtYen(previewReport.perCustomer)} />
              <Kpi label="現金過不足" value={previewReport.hasCashDiff ? (previewReport.cashDiff === 0 ? "±0" : `${(previewReport.cashDiff ?? 0) > 0 ? "+" : ""}${fmtYen(previewReport.cashDiff ?? 0)}`) : "—"} />
            </Kpis>

            <div>
              <div className="v2-h2" style={{ marginBottom: 8 }}>支払方法別</div>
              <div className="v2-table-wrap">
                <table className="v2-table">
                  <thead><tr><th>方法</th><th className="v2-num-cell">金額</th></tr></thead>
                  <tbody>
                    <tr><td>現金</td><td className="v2-num-cell">{fmtYen(previewReport.cash)}</td></tr>
                    <tr><td>カード</td><td className="v2-num-cell">{fmtYen(previewReport.card)}</td></tr>
                    <tr><td>QR</td><td className="v2-num-cell">{fmtYen(previewReport.qr)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {previewReport.categories.length > 0 && (
              <div>
                <div className="v2-h2" style={{ marginBottom: 8 }}>カテゴリ別売上</div>
                <div className="v2-table-wrap">
                  <table className="v2-table">
                    <thead><tr><th>カテゴリ</th><th className="v2-num-cell">金額</th><th className="v2-num-cell">点数</th></tr></thead>
                    <tbody>
                      {previewReport.categories.map(c => (
                        <tr key={c.category}><td>{c.label}</td><td className="v2-num-cell">{fmtYen(c.amount)}</td><td className="v2-num-cell">{c.qty}点</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {previewReport.creditCount > 0 && (
              <Banner variant="warn">
                本日発生の未払い(後払い): {previewReport.creditCount}件 {fmtYen(previewReport.credit)}
              </Banner>
            )}

            {previewReport.hasChipData && (
              <div>
                <div className="v2-h2" style={{ marginBottom: 8 }}>チップ収支</div>
                <Kpis>
                  <Kpi label="貸出" value={`${previewReport.chipOut.toLocaleString()}枚`} />
                  <Kpi label="回収" value={`${previewReport.chipIn.toLocaleString()}枚`} />
                  <Kpi label="収支" value={`${previewReport.chipNet >= 0 ? "+" : ""}${previewReport.chipNet.toLocaleString()}枚`} />
                </Kpis>
              </div>
            )}

            <Field label="特記事項" hint="日報に含まれます">
              <textarea rows={3} value={remarksInput} onChange={(e) => setRemarksInput(e.target.value)} placeholder="自由入力" />
            </Field>
          </VStack>
        )}
      </Modal>
    </VStack>
  );
}
