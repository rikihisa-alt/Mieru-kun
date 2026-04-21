"use client";

import { useState } from "react";
import Image from "next/image";
import { FileDown, DoorOpen, LogIn, LogOut as LogOutIcon, CalendarDays, CreditCard, ShoppingBag, Coins, ChevronLeft, ChevronRight } from "lucide-react";

// --- 型 ---
type EventType = "入店" | "退店" | "出勤" | "退勤" | "注文" | "精算" | "チップ" | "イベント";
interface HistoryEntry {
  id: string; date: string; time: string; type: EventType;
  name: string; realName?: string; detail?: string; amount?: number; rank?: string;
}

const TYPE_META: Record<EventType, { icon: React.ReactNode; color: string; bg: string }> = {
  "入店": { icon: <DoorOpen className="w-3 h-3" />, color: "#3a8f7c", bg: "#e8f5f0" },
  "退店": { icon: <LogOutIcon className="w-3 h-3" />, color: "#8e9baa", bg: "#f3f0ec" },
  "出勤": { icon: <LogIn className="w-3 h-3" />, color: "#2c3e50", bg: "#e8e4df" },
  "退勤": { icon: <LogOutIcon className="w-3 h-3" />, color: "#5a6977", bg: "#f3f0ec" },
  "注文": { icon: <ShoppingBag className="w-3 h-3" />, color: "#3a8f7c", bg: "#e8f5f0" },
  "精算": { icon: <CreditCard className="w-3 h-3" />, color: "#2e7d5b", bg: "#e8f5f0" },
  "チップ": { icon: <Coins className="w-3 h-3" />, color: "#d97706", bg: "#fdf4e8" },
  "イベント": { icon: <CalendarDays className="w-3 h-3" />, color: "#7c3aed", bg: "#f3e8fd" },
};

// デモデータ (顧客はnickname=表示名、realName=本名を両方保持)
const ALL_HISTORY: HistoryEntry[] = [
  { id: "h1", date: "2026/04/14", time: "21:30", type: "入店", name: "タロウ", realName: "田中 太郎", rank: "gold" },
  { id: "h2", date: "2026/04/14", time: "21:20", type: "注文", name: "ハナ", realName: "鈴木 花子", detail: "ウイスキー ×1", amount: 800, rank: "vip" },
  { id: "h3", date: "2026/04/14", time: "21:15", type: "入店", name: "ハナコ", realName: "佐藤 花子", rank: "vip" },
  { id: "h4", date: "2026/04/14", time: "21:00", type: "出勤", name: "山田 太郎", detail: "ディーラー" },
  { id: "h5", date: "2026/04/14", time: "20:50", type: "チップ", name: "タロウ", realName: "田中 太郎", detail: "+1,000枚", amount: 1000, rank: "gold" },
  { id: "h6", date: "2026/04/14", time: "20:45", type: "入店", name: "イチ", realName: "鈴木 一郎", rank: "regular" },
  { id: "h7", date: "2026/04/14", time: "20:40", type: "注文", name: "タロウ", realName: "田中 太郎", detail: "ビール ×2, 枝豆 ×1", amount: 1500, rank: "gold" },
  { id: "h8", date: "2026/04/14", time: "20:30", type: "精算", name: "ミィ", realName: "高橋 美咲", detail: "現金", amount: 3200, rank: "silver" },
  { id: "h9", date: "2026/04/14", time: "20:30", type: "退店", name: "ミィ", realName: "高橋 美咲", rank: "silver" },
  { id: "h10", date: "2026/04/14", time: "20:15", type: "退勤", name: "伊藤 美咲", detail: "フロア" },
  { id: "h11", date: "2026/04/14", time: "20:10", type: "入店", name: "ケンタ", realName: "渡辺 健太", rank: "regular" },
  { id: "h12", date: "2026/04/14", time: "20:00", type: "イベント", name: "VIPナイト", detail: "開始" },
  { id: "h13", date: "2026/04/14", time: "19:30", type: "注文", name: "ミィ", realName: "高橋 美咲", detail: "カクテル ×1, ピザ ×1", amount: 1500, rank: "silver" },
  { id: "h14", date: "2026/04/14", time: "18:30", type: "入店", name: "ミィ", realName: "高橋 美咲", rank: "silver" },
  { id: "h15", date: "2026/04/14", time: "18:00", type: "出勤", name: "鈴木 一郎", detail: "ディーラー" },
  { id: "h16", date: "2026/04/14", time: "18:00", type: "出勤", name: "佐藤 花", detail: "フロア" },
  { id: "h17", date: "2026/04/14", time: "17:30", type: "出勤", name: "高橋 健", detail: "ディーラー" },
  { id: "h18", date: "2026/04/13", time: "23:50", type: "精算", name: "ユウ", realName: "渡辺 優子", detail: "カード", amount: 12000, rank: "gold" },
  { id: "h19", date: "2026/04/13", time: "23:45", type: "退店", name: "ユウ", realName: "渡辺 優子", rank: "gold" },
  { id: "h20", date: "2026/04/13", time: "22:00", type: "イベント", name: "ポーカー大会", detail: "終了" },
];

const TABS: { key: string; label: string; types: EventType[] }[] = [
  { key: "all", label: "すべて", types: [] },
  { key: "visit", label: "入退店", types: ["入店", "退店"] },
  { key: "attendance", label: "出退勤", types: ["出勤", "退勤"] },
  { key: "sales", label: "売上", types: ["注文", "精算"] },
  { key: "chip", label: "チップ", types: ["チップ"] },
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="tabs">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`tab ${activeTab === t.key ? "tab-active" : ""}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            className="text-[12px] px-2 py-1 border border-border rounded-[4px] w-36" />
          {dateFilter && <button onClick={() => setDateFilter("")} className="text-[11px] text-text-tertiary hover:text-text-secondary">クリア</button>}
          <button onClick={exportPDF} className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-text-secondary hover:bg-bg-hover rounded-[6px]">
            <FileDown className="w-3.5 h-3.5" />PDF出力
          </button>
        </div>
      </div>

      {/* 件数 */}
      <p className="text-[12px] text-text-tertiary">{filtered.length}件</p>

      {/* タイムライン表示 */}
      {Object.entries(grouped).map(([date, entries]) => (
        <div key={date}>
          <p className="text-[12px] font-semibold text-text-primary pb-1.5 mb-0 border-b border-border">{date}</p>
          <div className="relative">
            <div className="absolute left-[39px] top-0 bottom-0 w-px bg-border-light" />
            {entries.map(e => {
              const meta = TYPE_META[e.type];
              return (
                <div key={e.id} className="flex items-start gap-3 py-2 hover:bg-bg-hover rounded-[4px] transition-colors relative">
                  <span className="text-[11px] text-text-tertiary font-mono w-8 text-right pt-0.5 flex-shrink-0">{e.time}</span>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 z-10" style={{ backgroundColor: meta.bg, color: meta.color }}>
                    {meta.icon}
                  </div>
                  <div className="flex items-center gap-2 pt-0.5 flex-1 min-w-0">
                    <span className="t-micro flex-shrink-0" style={{ color: meta.color }}>{e.type}</span>
                    <span className="text-[12px] font-medium text-text-primary truncate">{e.name}</span>
                    {e.realName && <span className="text-[11px] text-text-tertiary truncate">（{e.realName}）</span>}
                    {e.detail && <span className="text-[11px] text-text-tertiary truncate">{e.detail}</span>}
                  </div>
                  {e.amount != null && (
                    <span className="text-[12px] font-semibold text-text-primary flex-shrink-0">¥{e.amount.toLocaleString()}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Image src="/logo-icon.png" alt="みえるくん" width={32} height={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-[13px] text-text-tertiary">該当する履歴がありません</p>
        </div>
      )}
    </div>
  );
}
