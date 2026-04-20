"use client";

import { useState } from "react";
import { Download, TrendingUp } from "lucide-react";

const DAILY_DEMO = [
  { date: "2026-04-20", total: 148000, cash: 76000, card: 52000, qr: 12000, tip: 8000, orders: 42 },
  { date: "2026-04-19", total: 196000, cash: 92000, card: 78000, qr: 18000, tip: 8000, orders: 55 },
  { date: "2026-04-18", total: 172000, cash: 88000, card: 64000, qr: 15000, tip: 5000, orders: 48 },
  { date: "2026-04-17", total: 134000, cash: 72000, card: 48000, qr: 10000, tip: 4000, orders: 38 },
  { date: "2026-04-16", total: 118000, cash: 65000, card: 42000, qr: 8000, tip: 3000, orders: 32 },
];

const STAFF_DEMO = [
  { name: "山田 太郎", role: "店長", handled: 145, sales: 420000 },
  { name: "鈴木 一郎", role: "ディーラー", handled: 98, sales: 280000 },
  { name: "佐藤 花", role: "フロア", handled: 76, sales: 190000 },
];

export default function ReportPage() {
  const [tab, setTab] = useState<"daily" | "method" | "staff">("daily");
  const total = DAILY_DEMO.reduce((s, d) => s + d.total, 0);

  function exportCSV() {
    let header = "";
    let rows: string[] = [];
    let filename = "report.csv";

    if (tab === "daily") {
      filename = "daily_sales.csv";
      header = "日付,売上合計,現金,カード,QR,チップ相殺,件数";
      rows = DAILY_DEMO.map((d) => `${d.date},${d.total},${d.cash},${d.card},${d.qr},${d.tip},${d.orders}`);
    } else if (tab === "method") {
      filename = "sales_by_method.csv";
      header = "支払方法,金額,構成比";
      const totals = [
        { label: "現金", value: DAILY_DEMO.reduce((s, d) => s + d.cash, 0) },
        { label: "カード", value: DAILY_DEMO.reduce((s, d) => s + d.card, 0) },
        { label: "QR決済", value: DAILY_DEMO.reduce((s, d) => s + d.qr, 0) },
        { label: "チップ相殺", value: DAILY_DEMO.reduce((s, d) => s + d.tip, 0) },
      ];
      rows = totals.map((t) => `${t.label},${t.value},${Math.round((t.value / total) * 100)}%`);
    } else {
      filename = "sales_by_staff.csv";
      header = "スタッフ,役割,処理件数,売上担当額";
      rows = STAFF_DEMO.map((s) => `${s.name},${s.role},${s.handled},${s.sales}`);
    }

    const csv = "\ufeff" + [header, ...rows].join("\r\n"); // BOM for Excel
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center gap-1">
        <button onClick={() => setTab("daily")} className={`px-3 py-1.5 text-[12px] rounded-[6px] ${tab === "daily" ? "bg-text-primary text-white" : "text-text-secondary hover:bg-bg-hover"}`}>
          日次売上
        </button>
        <button onClick={() => setTab("method")} className={`px-3 py-1.5 text-[12px] rounded-[6px] ${tab === "method" ? "bg-text-primary text-white" : "text-text-secondary hover:bg-bg-hover"}`}>
          支払方法別
        </button>
        <button onClick={() => setTab("staff")} className={`px-3 py-1.5 text-[12px] rounded-[6px] ${tab === "staff" ? "bg-text-primary text-white" : "text-text-secondary hover:bg-bg-hover"}`}>
          スタッフ別
        </button>
        <button onClick={exportCSV} className="ml-auto flex items-center gap-1 px-3 py-1.5 text-[12px] text-text-secondary hover:bg-bg-hover rounded-[var(--radius)]">
          <Download className="w-3.5 h-3.5" />CSV出力
        </button>
      </div>

      {/* 合計チップ */}
      <div className="flex items-baseline gap-3">
        <span className="text-[12px] text-text-tertiary">直近5日 売上</span>
        <span className="text-[22px] font-bold text-text-primary">¥{total.toLocaleString()}</span>
        <span className="text-[12px] text-accent flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />前5日比 +12.4%
        </span>
      </div>

      {tab === "daily" && (
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border-light">
              <th className="px-3 py-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-left">日付</th>
              <th className="px-3 py-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-right">売上合計</th>
              <th className="px-3 py-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-right">現金</th>
              <th className="px-3 py-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-right">カード</th>
              <th className="px-3 py-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-right">QR</th>
              <th className="px-3 py-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-right">チップ相殺</th>
              <th className="px-3 py-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-right">件数</th>
            </tr>
          </thead>
          <tbody>
            {DAILY_DEMO.map((d) => (
              <tr key={d.date} className="border-b border-border-light hover:bg-bg-hover">
                <td className="px-3 py-2 font-medium">{d.date.slice(5)}</td>
                <td className="px-3 py-2 text-right font-bold">¥{d.total.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">¥{d.cash.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">¥{d.card.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">¥{d.qr.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">¥{d.tip.toLocaleString()}</td>
                <td className="px-3 py-2 text-right text-text-secondary">{d.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "method" && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "現金", value: DAILY_DEMO.reduce((s, d) => s + d.cash, 0), color: "#3a8f7c" },
            { label: "カード", value: DAILY_DEMO.reduce((s, d) => s + d.card, 0), color: "#2c3e50" },
            { label: "QR決済", value: DAILY_DEMO.reduce((s, d) => s + d.qr, 0), color: "#7c3aed" },
            { label: "チップ相殺", value: DAILY_DEMO.reduce((s, d) => s + d.tip, 0), color: "#d97706" },
          ].map((m) => (
            <div key={m.label} className="p-4 border border-border-light rounded-[6px]">
              <div className="text-[11px] text-text-tertiary">{m.label}</div>
              <div className="text-[18px] font-bold" style={{ color: m.color }}>¥{m.value.toLocaleString()}</div>
              <div className="text-[11px] text-text-tertiary mt-1">{Math.round((m.value / total) * 100)}%</div>
            </div>
          ))}
        </div>
      )}

      {tab === "staff" && (
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border-light">
              <th className="px-3 py-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-left">スタッフ</th>
              <th className="px-3 py-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-left">役割</th>
              <th className="px-3 py-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-right">処理件数</th>
              <th className="px-3 py-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-right">売上担当額</th>
            </tr>
          </thead>
          <tbody>
            {STAFF_DEMO.map((s) => (
              <tr key={s.name} className="border-b border-border-light hover:bg-bg-hover">
                <td className="px-3 py-2 font-medium">{s.name}</td>
                <td className="px-3 py-2 text-text-secondary">{s.role}</td>
                <td className="px-3 py-2 text-right">{s.handled}</td>
                <td className="px-3 py-2 text-right font-bold">¥{s.sales.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
