"use client";

import { useState } from "react";
import Image from "next/image";
import { FileDown, DoorOpen, LogIn, LogOut as LogOutIcon, CalendarDays, CreditCard, ShoppingBag, Coins, Gift, ChevronLeft, ChevronRight } from "lucide-react";

// --- 型 ---
type EventType = "入店" | "退店" | "出勤" | "退勤" | "注文" | "精算" | "チップ" | "イベント" | "プライズ";
interface HistoryEntry {
  id: string; date: string; time: string; type: EventType;
  name: string; realName?: string; detail?: string; amount?: number; rank?: string;
}

const TYPE_META: Record<EventType, { icon: React.ReactNode; color: string; bg: string }> = {
  "入店":     { icon: <DoorOpen className="w-3 h-3" />,   color: "#3a8f7c", bg: "#e8f5f0" },
  "退店":     { icon: <LogOutIcon className="w-3 h-3" />, color: "#8e9baa", bg: "#f3f0ec" },
  "出勤":     { icon: <LogIn className="w-3 h-3" />,      color: "#2c3e50", bg: "#e8e4df" },
  "退勤":     { icon: <LogOutIcon className="w-3 h-3" />, color: "#5a6977", bg: "#f3f0ec" },
  "注文":     { icon: <ShoppingBag className="w-3 h-3" />, color: "#3a8f7c", bg: "#e8f5f0" },
  "精算":     { icon: <CreditCard className="w-3 h-3" />, color: "#2e7d5b", bg: "#e8f5f0" },
  "チップ":   { icon: <Coins className="w-3 h-3" />,     color: "#d97706", bg: "#fdf4e8" },
  "イベント": { icon: <CalendarDays className="w-3 h-3" />, color: "#7c3aed", bg: "#f3e8fd" },
  "プライズ": { icon: <Gift className="w-3 h-3" />,      color: "#b8337e", bg: "#fce8f0" },
};

// デモデータ (顧客はnickname=表示名、realName=本名を両方保持)
const ALL_HISTORY: HistoryEntry[] = [];

const TABS: { key: string; label: string; types: EventType[] }[] = [
  { key: "all", label: "すべて", types: [] },
  { key: "visit", label: "入退店", types: ["入店", "退店"] },
  { key: "attendance", label: "出退勤", types: ["出勤", "退勤"] },
  { key: "sales", label: "売上", types: ["注文", "精算"] },
  { key: "chip", label: "チップ", types: ["チップ"] },
  { key: "prize", label: "プライズ", types: ["プライズ"] },
  { key: "event", label: "イベント", types: ["イベント"] },
];

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const currentTab = TABS.find(t => t.key === activeTab)!;
  const filtered = ALL_HISTORY.filter(h => {
    if (currentTab.types.length > 0 && !currentTab.types.includes(h.type)) return false;
    if (dateFilter && !h.date.includes(dateFilter)) return false;
    return true;
  });

  // 日付ごとにグループ化
  const grouped = filtered.reduce<Record<string, HistoryEntry[]>>((acc, h) => {
    (acc[h.date] ??= []).push(h);
    return acc;
  }, {});

  function exportPDF() {
    const w = window.open("", "_blank"); if (!w) return;
    const tabLabel = currentTab.label;
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>履歴 - ${tabLabel}</title>
      <style>body{font-family:"Hiragino Sans",sans-serif;padding:20px;font-size:11px;color:#2c3e50}
      h1{font-size:15px;margin-bottom:2px}p.sub{color:#8e9baa;font-size:10px;margin-bottom:16px}
      table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #e8e4df;padding:5px 8px;text-align:left}
      th{font-size:9px;text-transform:uppercase;color:#8e9baa;font-weight:600}
      .date-header{font-size:12px;font-weight:600;padding:10px 0 4px;border-bottom:1px solid #d8d3cc}
      .amount{font-weight:600}.type{font-size:10px;font-weight:600;padding:1px 5px;border-radius:3px}</style></head>
      <body><h1>履歴 — ${tabLabel}</h1>
      <p class="sub">${dateFilter || "全期間"} | Come On Casino | てんぽみえるくん</p>`;

    Object.entries(grouped).forEach(([date, entries]) => {
      html += `<div class="date-header">${date}</div>`;
      html += `<table><thead><tr><th>時間</th><th>種別</th><th>名前</th><th>詳細</th><th>金額</th></tr></thead><tbody>`;
      entries.forEach(e => {
        const displayName = e.realName ? `${e.name}（${e.realName}）` : e.name;
        html += `<tr><td>${e.time}</td><td>${e.type}</td><td>${displayName}</td><td>${e.detail ?? ""}</td><td>${e.amount ? "¥" + e.amount.toLocaleString() : ""}</td></tr>`;
      });
      html += `</tbody></table>`;
    });

    html += `</body></html>`;
    w.document.write(html); w.document.close();
    setTimeout(() => w.print(), 500);
  }

  return (
    <div className="page-stack">
      {/* タブ + フィルタ */}
      <section>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="tabs">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`tab ${activeTab === t.key ? "tab-active" : ""}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="max-w-[160px]" />
            {dateFilter && <button onClick={() => setDateFilter("")} className="btn btn-ghost btn-xs">クリア</button>}
            <button onClick={exportPDF} className="btn btn-secondary btn-sm">
              <FileDown className="w-3.5 h-3.5" />PDF出力
            </button>
          </div>
        </div>
        <p className="t-xs text-text-tertiary mt-3">{filtered.length}件</p>
      </section>

      {/* タイムライン表示 */}
      {Object.entries(grouped).map(([date, entries]) => (
        <section key={date} className="glass-panel">
          <p className="t-label mb-3">{date}</p>
          <div className="relative">
            <div className="absolute left-[40px] top-2 bottom-2 w-px bg-[rgba(28,46,60,0.08)]" />
            {entries.map(e => {
              const meta = TYPE_META[e.type];
              return (
                <div key={e.id} className="flex items-center gap-3 py-2.5 px-2 rounded-[var(--radius-sm)] hover:bg-white/60 transition-colors">
                  <span className="text-[12px] text-text-tertiary font-mono w-10 text-right flex-shrink-0">{e.time}</span>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 border"
                    style={{ background: "rgba(255,255,255,0.7)", borderColor: `${meta.color}33`, color: meta.color, backdropFilter: "blur(4px)" }}
                  >
                    {meta.icon}
                  </div>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="t-micro flex-shrink-0" style={{ color: meta.color }}>{e.type}</span>
                    <span className="text-[14px] font-medium text-text-primary truncate">{e.name}</span>
                    {e.realName && <span className="text-[12px] text-text-tertiary truncate">（{e.realName}）</span>}
                    {e.detail && <span className="text-[12px] text-text-tertiary truncate">{e.detail}</span>}
                  </div>
                  {e.amount != null && (
                    <span className="text-[14px] font-semibold text-text-primary flex-shrink-0 tabular-nums">¥{e.amount.toLocaleString()}</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {filtered.length === 0 && (
        <section className="glass-panel text-center py-16">
          <Image src="/logo-icon.png" alt="みえるくん" width={32} height={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-[14px] text-text-tertiary">該当する履歴がありません</p>
        </section>
      )}
    </div>
  );
}
