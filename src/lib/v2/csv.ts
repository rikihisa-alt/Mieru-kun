"use client";

// =================================================================
// CSV 出力/取込 共通ユーティリティ (スプレッドシート移行の土台)
// =================================================================

/** セル1個をCSV用にエスケープ (カンマ・改行・ダブルクォートを含む場合のみクォートで囲む) */
function escapeCell(v: string | number | undefined | null): string {
  const s = v === undefined || v === null ? "" : String(v);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** ヘッダー行 + データ行から CSV 文字列を生成 (CRLF区切り) */
export function toCsv(headers: string[], rows: (string | number | undefined | null)[][]): string {
  const lines = [headers.map(escapeCell).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(","));
  }
  return lines.join("\r\n");
}

/** UTF-8 BOM付きCSVをブラウザにダウンロードさせる (Excelでの文字化け防止のためBOM必須) */
export function downloadCsv(filename: string, csv: string) {
  if (typeof window === "undefined") return;
  const BOM = "﻿";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 簡易CSVパーサ。ダブルクォート囲み・エスケープ("")・クォート内改行に対応。
 * 戻り値: 行×セルの二次元配列 (末尾の空行は除去)
 */
export function parseCsv(text: string): string[][] {
  // BOM除去
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  let i = 0;
  const len = src.length;

  function pushCell() {
    row.push(cell);
    cell = "";
  }
  function pushRow() {
    pushCell();
    rows.push(row);
    row = [];
  }

  while (i < len) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cell += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (c === ",") {
      pushCell();
      i += 1;
      continue;
    }
    if (c === "\r") {
      // \r\n または \r 単体を改行として扱う
      if (src[i + 1] === "\n") i += 1;
      pushRow();
      i += 1;
      continue;
    }
    if (c === "\n") {
      pushRow();
      i += 1;
      continue;
    }
    cell += c;
    i += 1;
  }
  // 最後のセル/行を確定 (空行のみ残った場合は捨てる)
  if (cell.length > 0 || row.length > 0) {
    pushRow();
  }

  // 完全な空行 (すべてのセルが空文字, 1列のみ) を末尾から除去
  while (rows.length > 0) {
    const last = rows[rows.length - 1];
    if (last.length === 1 && last[0] === "") {
      rows.pop();
    } else {
      break;
    }
  }

  return rows;
}
