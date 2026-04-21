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

  const avgDaily = Math.round(total / DAILY_DEMO.length);
  const totalOrders = DAILY_DEMO.reduce((s, d) => s + d.orders, 0);

  return (
    <div className="page-stack">
      {/* KPI横一列 */}
      <section>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="flex items-end gap-8 flex-wrap">
            <KpiItem label="直近5日 売上" value={`¥${total.toLocaleString()}`} />
            <KpiItem label="日次平均" value={`¥${avgDaily.toLocaleString()}`} />
            <KpiItem label="合計件数" value={totalOrders} unit="件" />
            <div className="flex flex-col items-start gap-1">
              <span className="t-label">前5日比</span>
              <span className="flex items-baseline gap-1">
                <span className="t-value" style={{ color: "var(--primary-text)" }}>+12.4%</span>
                <TrendingUp className="w-5 h-5 text-[color:var(--primary-text)]" />
              </span>
            </div>
          </div>
          <button onClick={exportCSV} className="btn btn-secondary">
            <Download className="w-3.5 h-3.5" />CSV出力
          </button>
        </div>
      </section>

      {/* タブ */}
      <section>
        <div className="tabs">
          <button onClick={() => setTab("daily")} className={`tab ${tab === "daily" ? "tab-active" : ""}`}>日次売上</button>
          <button onClick={() => setTab("method")} className={`tab ${tab === "method" ? "tab-active" : ""}`}>支払方法別</button>
          <button onClick={() => setTab("staff")} className={`tab ${tab === "staff" ? "tab-active" : ""}`}>スタッフ別</button>
        </div>
      </section>

      {/* メインコンテンツ */}
      {tab === "daily" && (
        <section className="glass-panel">
          <p className="t-label mb-3">日次売上</p>
          <table className="data-table">
            <thead>
              <tr>
                <th>日付</th>
                <th className="text-right">売上合計</th>
                <th className="text-right">現金</th>
                <th className="text-right">カード</th>
                <th className="text-right">QR</th>
                <th className="text-right">チップ相殺</th>
                <th className="text-right">件数</th>
              </tr>
            </thead>
            <tbody>
              {DAILY_DEMO.map((d) => (
                <tr key={d.date}>
                  <td className="font-medium">{d.date.slice(5)}</td>
                  <td className="text-right font-bold">¥{d.total.toLocaleString()}</td>
                  <td className="text-right">¥{d.cash.toLocaleString()}</td>
                  <td className="text-right">¥{d.card.toLocaleString()}</td>
                  <td className="text-right">¥{d.qr.toLocaleString()}</td>
                  <td className="text-right">¥{d.tip.toLocaleString()}</td>
                  <td className="text-right text-text-secondary">{d.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === "method" && (
        <section className="glass-panel">
          <p className="t-label mb-4">支払方法別</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "現金", value: DAILY_DEMO.reduce((s, d) => s + d.cash, 0), chip: "chip-success" },
              { label: "カード", value: DAILY_DEMO.reduce((s, d) => s + d.card, 0), chip: "chip-accent" },
              { label: "QR決済", value: DAILY_DEMO.reduce((s, d) => s + d.qr, 0), chip: "chip-vip" },
              { label: "チップ相殺", value: DAILY_DEMO.reduce((s, d) => s + d.tip, 0), chip: "chip-warning" },
            ].map((m) => (
              <div key={m.label} className="flex flex-col gap-2 pb-4 border-b border-border-light md:border-b-0">
                <span className={`chip ${m.chip} chip-sm self-start`}>{m.label}</span>
                <span className="text-[20px] font-bold text-text-primary tabular-nums">¥{m.value.toLocaleString()}</span>
                <span className="t-xs text-text-tertiary">{Math.round((m.value / total) * 100)}%</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "staff" && (
        <section className="glass-panel">
          <p className="t-label mb-3">スタッフ別</p>
          <table className="data-table">
            <thead>
              <tr>
                <th>スタッフ</th>
                <th>役割</th>
                <th className="text-right">処理件数</th>
                <th className="text-right">売上担当額</th>
              </tr>
            </thead>
            <tbody>
              {STAFF_DEMO.map((s) => (
                <tr key={s.name}>
                  <td className="font-medium">{s.name}</td>
                  <td><span className="chip chip-neutral chip-sm">{s.role}</span></td>
                  <td className="text-right">{s.handled}</td>
                  <td className="text-right font-bold">¥{s.sales.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function KpiItem({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="t-label">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className="t-value">{value}</span>
        {unit && <span className="text-[14px] text-text-tertiary">{unit}</span>}
      </span>
    </div>
  );
}
