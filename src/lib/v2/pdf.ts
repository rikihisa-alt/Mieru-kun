"use client";

import { DEFAULT_STORE_NAME } from "@/lib/store/settings";

// =================================================================
// PDF出力ユーティリティ (印刷ウィンドウ方式 — ライブラリ依存ゼロ)
// 呼び出し: printDoc({ title, body, subtitle, landscape })
// =================================================================

export interface PrintDocOpts {
  title: string;
  subtitle?: string;
  body: string;        // HTMLフラグメント
  landscape?: boolean;
  storeName?: string;
}

const BASE_CSS = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 16mm 14mm;
    font-family: -apple-system, "Helvetica Neue", "Hiragino Sans", "Yu Gothic UI", sans-serif;
    font-size: 11px;
    color: #18181b;
    line-height: 1.45;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @page { margin: 0; }
  .pdf-head {
    display: flex; align-items: flex-end; justify-content: space-between;
    padding-bottom: 8px; margin-bottom: 14px;
    border-bottom: 1.5px solid #18181b;
  }
  h1.pdf-title { font-size: 18px; font-weight: 700; margin: 0; letter-spacing: -0.01em; }
  .pdf-sub { font-size: 10px; color: #71717a; margin-top: 2px; }
  .pdf-meta { text-align: right; font-size: 10px; color: #71717a; }
  table { width: 100%; border-collapse: collapse; }
  thead th {
    text-align: left; font-weight: 600;
    padding: 6px 8px; border-bottom: 1px solid #18181b;
    font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em;
    background: #fafafa;
  }
  tbody td { padding: 6px 8px; border-bottom: 1px solid #e5e5e5; vertical-align: top; }
  tbody tr:nth-child(even) td { background: #fafafa; }
  .num { text-align: right; font-variant-numeric: tabular-nums; font-family: ui-monospace, "SF Mono", Menlo, monospace; }
  .mute { color: #71717a; }
  .badge { display: inline-block; padding: 1px 6px; border: 1px solid #d4d4d4; border-radius: 999px; font-size: 9px; }
  .pdf-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border: 1px solid #d4d4d4; border-radius: 3px; overflow: hidden; margin-bottom: 14px; }
  .pdf-kpi { padding: 8px 10px; border-right: 1px solid #d4d4d4; }
  .pdf-kpi:last-child { border-right: 0; }
  .pdf-kpi-l { font-size: 9px; color: #71717a; text-transform: uppercase; letter-spacing: 0.04em; }
  .pdf-kpi-v { font-size: 18px; font-weight: 700; margin-top: 2px; font-variant-numeric: tabular-nums; }
  h2.pdf-h2 { font-size: 12px; margin: 18px 0 8px; font-weight: 600; border-bottom: 1px solid #d4d4d4; padding-bottom: 4px; }
  .pdf-foot { margin-top: 24px; padding-top: 8px; border-top: 1px solid #d4d4d4; font-size: 9px; color: #71717a; display: flex; justify-content: space-between; }
`;

export function printDoc({ title, subtitle, body, landscape, storeName }: PrintDocOpts) {
  if (typeof window === "undefined") return;
  const w = window.open("", "_blank", "width=900,height=1200");
  if (!w) {
    alert("ポップアップがブロックされています。許可してから再実行してください。");
    return;
  }
  const now = new Date().toLocaleString("ja-JP");
  const orient = landscape ? "@page { size: A4 landscape; margin: 0; }" : "@page { size: A4 portrait; margin: 0; }";
  const html = `<!DOCTYPE html>
<html lang="ja"><head>
  <meta charset="utf-8" />
  <title>${escape(title)}</title>
  <style>${orient}${BASE_CSS}</style>
</head><body>
  <div class="pdf-head">
    <div>
      <h1 class="pdf-title">${escape(title)}</h1>
      ${subtitle ? `<div class="pdf-sub">${escape(subtitle)}</div>` : ""}
    </div>
    <div class="pdf-meta">
      ${storeName ? `<div>${escape(storeName)}</div>` : ""}
      <div>${now}</div>
    </div>
  </div>
  ${body}
  <div class="pdf-foot">
    <span>${escape(title)}</span>
    <span>てんぽみえるくん</span>
  </div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 100); };</script>
</body></html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

// =================================================================
// 便利ヘルパー
// =================================================================
export function tableHtml(headers: string[], rows: (string | number)[][], opts?: { numCols?: number[] }): string {
  const numSet = new Set(opts?.numCols ?? []);
  const head = headers.map((h, i) => `<th class="${numSet.has(i) ? "num" : ""}">${escape(h)}</th>`).join("");
  const body = rows.map(r => `<tr>${r.map((c, i) => `<td class="${numSet.has(i) ? "num" : ""}">${escape(String(c))}</td>`).join("")}</tr>`).join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

export function kpisHtml(items: { label: string; value: string }[]): string {
  const cells = items.map(i => `<div class="pdf-kpi"><div class="pdf-kpi-l">${escape(i.label)}</div><div class="pdf-kpi-v">${escape(i.value)}</div></div>`).join("");
  return `<div class="pdf-kpis">${cells}</div>`;
}

export function sectionHtml(title: string, inner: string): string {
  return `<h2 class="pdf-h2">${escape(title)}</h2>${inner}`;
}

export function escapeHtml(s: string): string { return escape(s); }

// =================================================================
// レシート/領収書 印刷 (サーマルプリンタ幅 58mm/80mm 相当の縦長明細)
// 呼び出し: printReceipt(order, opts)
// printDoc とは別窓・別レイアウト(横幅固定・等幅フォント・モノクロ)。
// =================================================================
export interface ReceiptItem {
  name: string;
  price: number;
  qty: number;
}

export interface ReceiptOrder {
  id: string;
  customer: string;   // 顧客名 / ポーカーネーム
  table?: string;
  items: ReceiptItem[];
  total: number;
  createdAt: string;  // ISO
  settledAt?: string; // ISO (あれば優先して表示)
}

export interface PrintReceiptOpts {
  storeName?: string;
  width?: 58 | 80;                 // サーマル用紙幅(mm)。既定80
  mode?: "receipt" | "invoice";    // "receipt"=レシート(通常) / "invoice"=領収書(宛名空欄+但し書き)
  paymentLabel?: string;           // 支払方法の表示ラベル(呼び出し側で日本語化済みの文字列)
}

function receiptCss(width: number): string {
  const base = width === 58 ? 10 : 11;
  return `
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      width: ${width}mm;
      padding: 3mm 3mm 8mm;
      font-family: ui-monospace, "SF Mono", Menlo, "MS Gothic", monospace;
      font-size: ${base}px;
      color: #000;
      line-height: 1.55;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page { size: ${width}mm auto; margin: 0; }
    .r-center { text-align: center; }
    .r-store { font-size: ${base + 3}px; font-weight: 700; }
    .r-mode { font-size: ${base + 1}px; font-weight: 700; margin-top: 3px; letter-spacing: 0.14em; }
    .r-meta { font-size: ${base - 1}px; margin-top: 5px; }
    .r-to { font-size: ${base}px; margin: 2px 0; }
    .r-to-blank { display: inline-block; min-width: 65%; border-bottom: 1px solid #000; padding-bottom: 2px; }
    .r-hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
    table.r-items { width: 100%; border-collapse: collapse; }
    table.r-items td { padding: 1px 0; vertical-align: top; }
    .r-item-name { padding-top: 4px !important; }
    .r-item-detail { color: #333; }
    .r-amt { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .r-total-row td { padding-top: 8px !important; font-weight: 700; font-size: ${base + 3}px; border-top: 1px solid #000; }
    .r-pay { margin-top: 6px; font-size: ${base - 1}px; }
    .r-note { margin-top: 12px; font-size: ${base - 1}px; color: #333; }
    .r-foot { margin-top: 12px; font-size: ${base - 1}px; text-align: center; color: #333; }
  `;
}

export function printReceipt(order: ReceiptOrder, opts?: PrintReceiptOpts) {
  if (typeof window === "undefined") return;
  const width = opts?.width ?? 80;
  const mode = opts?.mode ?? "receipt";
  const store = opts?.storeName || DEFAULT_STORE_NAME;
  const w = window.open("", "_blank", "width=420,height=700");
  if (!w) {
    alert("ポップアップがブロックされています。許可してから再実行してください。");
    return;
  }
  const dt = new Date(order.settledAt ?? order.createdAt).toLocaleString("ja-JP");
  const title = mode === "invoice" ? "領収書" : "レシート";

  const itemRows = order.items.map(i => `
    <tr><td colspan="2" class="r-item-name">${escape(i.name)}</td></tr>
    <tr>
      <td class="r-item-detail">&nbsp;&nbsp;${i.qty} × ¥${i.price.toLocaleString()}</td>
      <td class="r-amt">¥${(i.price * i.qty).toLocaleString()}</td>
    </tr>`).join("");

  // レシート: 注文の顧客名(ポーカーネーム)をそのまま表示
  // 領収書: 宛名は空欄(手書き用の下線のみ)にし、但し書きを付す
  const toBlock = mode === "invoice"
    ? `<div class="r-to"><span class="r-to-blank">&nbsp;</span> 様</div>`
    : `<div class="r-to">${escape(order.customer)} 様</div>`;
  const noteBlock = mode === "invoice"
    ? `<div class="r-note">但し お品代として上記正に領収いたしました。</div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="ja"><head>
  <meta charset="utf-8" />
  <title>${escape(title)}</title>
  <style>${receiptCss(width)}</style>
</head><body>
  <div class="r-center">
    <div class="r-store">${escape(store)}</div>
    <div class="r-mode">${escape(title)}</div>
    <div class="r-meta">${dt}${order.table ? ` ／ 卓 ${escape(order.table)}` : ""}</div>
    <div class="r-meta">No. ${escape(order.id)}</div>
  </div>
  <hr class="r-hr" />
  ${toBlock}
  <hr class="r-hr" />
  <table class="r-items">
    ${itemRows}
    <tr class="r-total-row"><td>合計</td><td class="r-amt">¥${order.total.toLocaleString()}</td></tr>
  </table>
  ${opts?.paymentLabel ? `<div class="r-pay">お支払い方法: ${escape(opts.paymentLabel)}</div>` : ""}
  ${noteBlock}
  <div class="r-foot">ありがとうございました</div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 100); };</script>
</body></html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
}
