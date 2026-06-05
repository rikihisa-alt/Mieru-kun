"use client";

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
