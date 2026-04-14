"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings2, X, GripVertical, AlertTriangle, ArrowUpRight, DoorOpen, LogIn, LogOut as LogOutIcon, CalendarDays, Clock } from "lucide-react";

const RANK_DOT: Record<string, string> = { regular: "#8e9baa", silver: "#5a6977", gold: "#d97706", vip: "#7c3aed" };

interface TableInfo { name: string; occupied: number; max: number; type: string; }
interface TimelineEvent { time: string; type: "入店" | "退店" | "出勤" | "退勤" | "イベント"; name: string; detail?: string; rank?: string; }
interface EventItem { title: string; time: string; status: string; participants: number; }
interface DashSection { id: string; label: string; visible: boolean; }
interface AlertSetting { id: string; label: string; enabled: boolean; color: string; }

export default function DashboardPage() {
  const router = useRouter();

  const kpis = { visitors: 23, unpaid: 2, activeTables: 6, totalTables: 8, onDuty: 8, sales: 185000, avgSpend: 8043, orders: 47, targetSales: 250000 };
  const progressPct = Math.min(100, Math.round((kpis.sales / kpis.targetSales) * 100));

  const tables: TableInfo[] = [
    { name: "VIP-1", occupied: 4, max: 6, type: "VIP" }, { name: "VIP-2", occupied: 6, max: 6, type: "VIP" },
    { name: "A-1", occupied: 3, max: 4, type: "一般" }, { name: "A-2", occupied: 0, max: 4, type: "一般" },
    { name: "A-3", occupied: 2, max: 4, type: "一般" }, { name: "B-1", occupied: 4, max: 4, type: "一般" },
    { name: "B-2", occupied: 0, max: 4, type: "一般" }, { name: "S-1", occupied: 3, max: 4, type: "S-VIP" },
  ];
  const events: EventItem[] = [
    { title: "VIPナイト", time: "20:00-24:00", status: "進行中", participants: 12 },
    { title: "新作カクテル試飲会", time: "22:00-23:00", status: "準備中", participants: 8 },
  ];
  // タイムライン: 入店・退店・出勤・退勤・イベントを時系列で
  const timeline: TimelineEvent[] = [
    { time: "21:30", type: "入店", name: "田中 太郎", rank: "gold" },
    { time: "21:15", type: "入店", name: "佐藤 花子", rank: "vip" },
    { time: "21:00", type: "出勤", name: "山田 太郎", detail: "ディーラー" },
    { time: "20:45", type: "入店", name: "鈴木 一郎", rank: "regular" },
    { time: "20:30", type: "退店", name: "高橋 美咲", rank: "silver" },
    { time: "20:15", type: "退勤", name: "伊藤 美咲", detail: "フロア" },
    { time: "20:10", type: "入店", name: "渡辺 健太", rank: "regular" },
    { time: "20:00", type: "イベント", name: "VIPナイト", detail: "開始" },
    { time: "18:00", type: "出勤", name: "鈴木 一郎", detail: "ディーラー" },
    { time: "18:00", type: "出勤", name: "佐藤 花", detail: "フロア" },
    { time: "17:30", type: "出勤", name: "高橋 健", detail: "ディーラー" },
  ];

  const [showSettings, setShowSettings] = useState(false);
  const [sections, setSections] = useState<DashSection[]>([
    { id: "summary", label: "本日集計", visible: true },
    { id: "alerts", label: "要対応", visible: true },
    { id: "tables", label: "卓稼働", visible: true },
    { id: "timeline", label: "タイムライン", visible: true },
  ]);
  const [alertSettings, setAlertSettings] = useState<AlertSetting[]>([
    { id: "unpaid", label: "未精算アラート", enabled: true, color: "#c0392b" },
    { id: "full_table", label: "満席アラート", enabled: true, color: "#c87b1a" },
  ]);

  function toggleSection(id: string) { setSections(p => p.map(s => s.id === id ? { ...s, visible: !s.visible } : s)); }
  function toggleAlert(id: string) { setAlertSettings(p => p.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a)); }
  function moveSection(id: string, dir: -1|1) {
    setSections(p => { const i = p.findIndex(s => s.id === id); if (i < 0) return p; const n = i+dir; if (n<0||n>=p.length) return p; const a=[...p]; [a[i],a[n]]=[a[n],a[i]]; return a; });
  }

  const fullTables = tables.filter(t => t.occupied >= t.max).length;
  const isVisible = (id: string) => sections.find(s => s.id === id)?.visible ?? true;
  const hasUnpaidAlert = alertSettings.find(a => a.id === "unpaid")?.enabled && kpis.unpaid > 0;
  const hasFullAlert = alertSettings.find(a => a.id === "full_table")?.enabled && fullTables > 0;

  const TYPE_ICON: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    "入店": { icon: <DoorOpen className="w-3 h-3" />, color: "#3a8f7c", bg: "#e8f5f0" },
    "退店": { icon: <LogOutIcon className="w-3 h-3" />, color: "#8e9baa", bg: "#f3f0ec" },
    "出勤": { icon: <LogIn className="w-3 h-3" />, color: "#2c3e50", bg: "#e8e4df" },
    "退勤": { icon: <LogOutIcon className="w-3 h-3" />, color: "#5a6977", bg: "#f3f0ec" },
    "イベント": { icon: <CalendarDays className="w-3 h-3" />, color: "#7c3aed", bg: "#f3e8fd" },
  };

  return (
    <div className="space-y-5 relative">
      <div className="absolute top-0 right-0">
        <button onClick={() => setShowSettings(true)} className="flex items-center gap-1 px-2 py-1 text-[11px] text-[#8e9baa] hover:bg-[#f3f0ec] rounded-[4px]"><Settings2 className="w-3 h-3" /></button>
      </div>

      {/* ===== 本日集計 ===== */}
      {isVisible("summary") && (
        <div className="flex items-center gap-2 flex-wrap text-[14px] pb-4 border-b border-[#e8e4df]">
          <span className="text-[#8e9baa] text-[13px] mr-1">本日集計：</span>
          <Chip label="来店" value={`${kpis.visitors}名`} color="#3a8f7c" onClick={() => router.push("/floor")} />
          <Chip label="売上" value={`¥${kpis.sales.toLocaleString()}`} />
          <Chip label="客単価" value={`¥${kpis.avgSpend.toLocaleString()}`} />
          <Chip label="達成率" value={`${progressPct}%`} color="#3a8f7c" />
          <Chip label="出勤" value={`${kpis.onDuty}名`} onClick={() => router.push("/attendance")} />
          {kpis.unpaid > 0 && <Chip label="未払" value={`${kpis.unpaid}件`} color="#c0392b" onClick={() => router.push("/orders")} />}
        </div>
      )}

      {/* ===== 要対応 ===== */}
      {isVisible("alerts") && (hasUnpaidAlert || hasFullAlert) && (
        <div>
          <p className="text-[13px] font-semibold text-[#2c3e50] mb-2">要対応</p>
          <div className="space-y-1.5">
            {hasUnpaidAlert && <AlertRow color="#c0392b" text={`未精算 ${kpis.unpaid}件 — 精算処理が必要です`} onClick={() => router.push("/orders")} />}
            {hasFullAlert && <AlertRow color="#c87b1a" text={`満席卓 ${fullTables}卓 — 卓管理を確認してください`} onClick={() => router.push("/tables")} />}
          </div>
        </div>
      )}

      {/* ===== 卓稼働 (全幅2列) ===== */}
      {isVisible("tables") && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-semibold text-[#2c3e50]">卓稼働 <span className="font-normal text-[#8e9baa]">{kpis.activeTables}/{kpis.totalTables}</span></p>
            <button onClick={() => router.push("/tables")} className="flex items-center gap-0.5 text-[11px] text-[#3a8f7c] hover:underline">卓管理<ArrowUpRight className="w-3 h-3" /></button>
          </div>
          <div className="grid grid-cols-2 gap-x-8">
            {[tables.slice(0, 4), tables.slice(4)].map((half, hi) => (
              <table key={hi} className="w-full text-[12px]">
                <tbody>
                  {half.map(t => {
                    const pct = t.max > 0 ? t.occupied / t.max : 0;
                    const full = pct >= 1; const empty = t.occupied === 0;
                    const c = full ? "#c0392b" : empty ? "#d8d3cc" : pct > 0.7 ? "#c87b1a" : "#3a8f7c";
                    return (
                      <tr key={t.name} className="border-b border-[#f3f0ec] hover:bg-[#faf8f5] cursor-pointer" onClick={() => router.push("/tables")}>
                        <td className="py-1.5 w-4"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} /></td>
                        <td className="py-1.5 font-medium w-14">{t.name}</td>
                        <td className="py-1.5 text-[#5a6977] w-10">{t.occupied}/{t.max}</td>
                        <td className="py-1.5 text-[#8e9baa] w-10">{t.type}</td>
                        <td className="py-1.5">
                          <div className="h-[5px] bg-[#f3f0ec] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, backgroundColor: c }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ))}
          </div>
        </div>
      )}

      {/* ===== タイムライン ===== */}
      {isVisible("timeline") && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-semibold text-[#2c3e50]">タイムライン</p>
            <button onClick={() => router.push("/history")} className="flex items-center gap-0.5 text-[11px] text-[#3a8f7c] hover:underline">すべての履歴<ArrowUpRight className="w-3 h-3" /></button>
          </div>

          {/* イベント: タイムライン見出しの直下に横並び */}
          {events.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-3 mb-2">
              {events.map((ev, i) => {
                const st = ev.status === "進行中" ? { bg: "#e8f5f0", text: "#2e7d5b" } : ev.status === "準備中" ? { bg: "#fdf4e8", text: "#c87b1a" } : { bg: "#f3f0ec", text: "#5a6977" };
                return (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] border border-[#e8e4df] hover:border-[#d8d3cc] cursor-pointer flex-shrink-0 whitespace-nowrap transition-colors">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-[3px]" style={{ backgroundColor: st.bg, color: st.text }}>{ev.status}</span>
                    <span className="text-[12px] font-medium text-[#2c3e50]">{ev.title}</span>
                    <span className="text-[11px] text-[#8e9baa]">{ev.time}</span>
                    <span className="text-[11px] text-[#8e9baa]">{ev.participants}名</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* タイムライン本体（スクロール） */}
          <div className="relative max-h-[360px] overflow-y-auto">
            <div className="absolute left-[39px] top-0 bottom-0 w-px bg-[#e8e4df]" />
            <div className="space-y-0">
              {timeline.map((ev, i) => {
                const t = TYPE_ICON[ev.type];
                return (
                  <div key={i} className="flex items-start gap-3 py-1.5 hover:bg-[#faf8f5] rounded-[4px] transition-colors cursor-pointer relative"
                    onClick={() => router.push(ev.type === "入店" || ev.type === "退店" ? "/floor" : ev.type === "イベント" ? "/tables" : "/attendance")}>
                    <span className="text-[11px] text-[#8e9baa] font-mono w-8 text-right pt-0.5 flex-shrink-0">{ev.time}</span>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 z-10" style={{ backgroundColor: t.bg, color: t.color }}>
                      {t.icon}
                    </div>
                    <div className="flex items-center gap-2 pt-0.5 min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wider flex-shrink-0" style={{ color: t.color }}>{ev.type}</span>
                      {ev.rank && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: RANK_DOT[ev.rank] }} />}
                      <span className="text-[12px] font-medium text-[#2c3e50] truncate">{ev.name}</span>
                      {ev.detail && <span className="text-[11px] text-[#8e9baa] flex-shrink-0">{ev.detail}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 設定パネル */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onClick={() => setShowSettings(false)}>
          <div className="w-72 bg-white h-full shadow-lg overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8e4df]">
              <span className="text-[13px] font-semibold">表示設定</span>
              <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-[#f3f0ec] rounded-[4px]"><X className="w-4 h-4 text-[#8e9baa]" /></button>
            </div>
            <div className="p-4 space-y-1">
              {sections.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-2 px-2 py-1.5 rounded-[4px] hover:bg-[#faf8f5]">
                  <GripVertical className="w-3 h-3 text-[#d8d3cc]" />
                  <label className="flex items-center gap-2 flex-1 cursor-pointer">
                    <input type="checkbox" checked={s.visible} onChange={() => toggleSection(s.id)} className="accent-[#3a8f7c]" />
                    <span className="text-[12px]">{s.label}</span>
                  </label>
                  <div className="flex gap-0.5">
                    <button onClick={() => moveSection(s.id, -1)} disabled={idx === 0} className="text-[10px] px-1 text-[#8e9baa] disabled:opacity-30">↑</button>
                    <button onClick={() => moveSection(s.id, 1)} disabled={idx === sections.length - 1} className="text-[10px] px-1 text-[#8e9baa] disabled:opacity-30">↓</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-[#e8e4df] space-y-1">
              <p className="text-[10px] text-[#8e9baa] font-semibold uppercase tracking-wider mb-1">アラート</p>
              {alertSettings.map(a => (
                <label key={a.id} className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-[#faf8f5] rounded-[4px]">
                  <input type="checkbox" checked={a.enabled} onChange={() => toggleAlert(a.id)} className="accent-[#3a8f7c]" />
                  <span className="text-[12px]">{a.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ label, value, color, onClick }: { label: string; value: string; color?: string; onClick?: () => void }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${onClick ? "cursor-pointer hover:opacity-70" : ""}`} onClick={onClick}>
      <span className="text-[#8e9baa] text-[13px]">{label}</span>
      <span className="text-[15px] font-bold" style={{ color: color ?? "#2c3e50" }}>{value}</span>
    </span>
  );
}

function AlertRow({ color, text, onClick }: { color: string; text: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className="flex items-center gap-2 py-2 px-3 rounded-[6px] cursor-pointer hover:opacity-80" style={{ backgroundColor: `${color}0a` }}>
      <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color }} />
      <span className="text-[13px]" style={{ color }}>{text}</span>
      <ArrowUpRight className="w-3.5 h-3.5 ml-auto" style={{ color }} />
    </div>
  );
}
