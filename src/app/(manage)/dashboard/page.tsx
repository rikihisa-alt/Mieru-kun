"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings2, X, GripVertical, AlertTriangle, Clock, Users, ChevronRight } from "lucide-react";

const RANK_DOT: Record<string, string> = { regular: "#8e9baa", silver: "#5a6977", gold: "#d97706", vip: "#7c3aed" };

interface TableInfo { name: string; occupied: number; max: number; }
interface RecentEntry { name: string; time: string; rank: string; }
interface EventItem { title: string; time: string; status: string; participants: number; }
interface DashSection { id: string; label: string; visible: boolean; }
interface AlertSetting { id: string; label: string; enabled: boolean; color: string; }

export default function DashboardPage() {
  const router = useRouter();

  const kpis = { visitors: 23, unpaid: 2, activeTables: 6, totalTables: 8, onDuty: 8, todayEvents: 2, sales: 185000, avgSpend: 8043, orders: 47, targetSales: 250000 };
  const progressPct = Math.min(100, Math.round((kpis.sales / kpis.targetSales) * 100));
  const tables: TableInfo[] = [
    { name: "VIP-1", occupied: 4, max: 6 }, { name: "VIP-2", occupied: 6, max: 6 },
    { name: "A-1", occupied: 3, max: 4 }, { name: "A-2", occupied: 0, max: 4 },
    { name: "A-3", occupied: 2, max: 4 }, { name: "B-1", occupied: 4, max: 4 },
    { name: "B-2", occupied: 0, max: 4 }, { name: "S-1", occupied: 3, max: 4 },
  ];
  const recentEntries: RecentEntry[] = [
    { name: "田中 太郎", time: "21:30", rank: "gold" }, { name: "佐藤 花子", time: "21:15", rank: "vip" },
    { name: "鈴木 一郎", time: "20:45", rank: "regular" }, { name: "高橋 美咲", time: "20:30", rank: "silver" },
    { name: "渡辺 健太", time: "20:10", rank: "regular" },
  ];
  const events: EventItem[] = [
    { title: "VIPナイト", time: "20:00〜24:00", status: "進行中", participants: 12 },
    { title: "新作カクテル試飲会", time: "22:00〜23:00", status: "準備中", participants: 8 },
  ];

  const [showSettings, setShowSettings] = useState(false);
  const [sections, setSections] = useState<DashSection[]>([
    { id: "status", label: "営業ステータス", visible: true },
    { id: "tables", label: "卓 & 入店", visible: true },
    { id: "events", label: "イベント", visible: true },
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
  const hasUnpaidAlert = alertSettings.find(a => a.id === "unpaid")?.enabled && kpis.unpaid > 0;
  const hasFullAlert = alertSettings.find(a => a.id === "full_table")?.enabled && fullTables > 0;

  return (
    <div className="space-y-5 relative">
      <div className="flex items-center justify-end">
        <button onClick={() => setShowSettings(true)} className="flex items-center gap-1 px-2 py-1 text-[11px] text-[#8e9baa] hover:bg-[#f3f0ec] rounded-[4px]">
          <Settings2 className="w-3 h-3" />設定
        </button>
      </div>

      {/* ===== アラート ===== */}
      {(hasUnpaidAlert || hasFullAlert) && (
        <div className="flex gap-2">
          {hasUnpaidAlert && (
            <button onClick={() => router.push("/orders")} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-[6px] text-[#c0392b] bg-[#c0392b]/8 hover:bg-[#c0392b]/15 transition-colors">
              <AlertTriangle className="w-3.5 h-3.5" />未精算 {kpis.unpaid}件
            </button>
          )}
          {hasFullAlert && (
            <button onClick={() => router.push("/tables")} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-[6px] text-[#c87b1a] bg-[#c87b1a]/8 hover:bg-[#c87b1a]/15 transition-colors">
              <AlertTriangle className="w-3.5 h-3.5" />満席 {fullTables}卓
            </button>
          )}
        </div>
      )}

      {/* ===== セクション描画 ===== */}
      {sections.filter(s => s.visible).map(s => {
        if (s.id === "status") return (
          <div key={s.id}>
            {/* 営業ステータス: 左=売上、右=指標テーブル */}
            <div className="flex gap-8 items-start">
              {/* 左: 売上ヒーロー */}
              <div className="cursor-pointer" onClick={() => router.push("/floor")}>
                <p className="text-[11px] text-[#8e9baa] font-medium mb-1">TODAY</p>
                <p className="text-[42px] font-black text-[#2c3e50] leading-none tracking-tighter">
                  ¥{kpis.sales.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <div className="flex-1 h-1 bg-[#e8e4df] rounded-full overflow-hidden" style={{ maxWidth: 160 }}>
                    <div className="h-full rounded-full bg-[#3a8f7c]" style={{ width: `${progressPct}%` }} />
                  </div>
                  <span className="text-[10px] text-[#3a8f7c] font-bold">{progressPct}%</span>
                </div>
              </div>

              {/* 右: 指標テーブル（枠なし、行だけ） */}
              <div className="flex-1 pt-1">
                <table className="w-full text-[13px]">
                  <tbody>
                    <Metric label="来店" value={`${kpis.visitors}名`} onClick={() => router.push("/floor")} />
                    <Metric label="客単価" value={`¥${kpis.avgSpend.toLocaleString()}`} />
                    <Metric label="注文" value={`${kpis.orders}件`} onClick={() => router.push("/orders")} />
                    <Metric label="出勤" value={`${kpis.onDuty}名`} onClick={() => router.push("/attendance")} />
                    <Metric label="未精算" value={`${kpis.unpaid}件`} color={kpis.unpaid > 0 ? "#c0392b" : undefined} onClick={() => router.push("/orders")} />
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

        if (s.id === "tables") return (
          <div key={s.id} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 卓稼働 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-[#8e9baa] font-semibold uppercase tracking-wider">卓稼働 {kpis.activeTables}/{kpis.totalTables}</p>
                <button onClick={() => router.push("/tables")} className="text-[11px] text-[#3a8f7c] hover:underline">詳細→</button>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {tables.map(t => {
                  const full = t.occupied >= t.max;
                  const empty = t.occupied === 0;
                  return (
                    <div key={t.name} onClick={() => router.push("/tables")}
                      className={`rounded-[6px] px-2.5 py-2 cursor-pointer transition-colors text-center ${
                        full ? "bg-[#c0392b]/8 hover:bg-[#c0392b]/15" : empty ? "bg-[#faf8f5] hover:bg-[#f3f0ec]" : "bg-[#e8f5f0] hover:bg-[#d0ebe4]"
                      }`}>
                      <p className={`text-[11px] font-medium ${full ? "text-[#c0392b]" : empty ? "text-[#8e9baa]" : "text-[#2c3e50]"}`}>{t.name}</p>
                      <p className={`text-[15px] font-bold ${full ? "text-[#c0392b]" : empty ? "text-[#8e9baa]" : "text-[#2c3e50]"}`}>{t.occupied}<span className="text-[10px] font-normal text-[#8e9baa]">/{t.max}</span></p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 最近の入店 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-[#8e9baa] font-semibold uppercase tracking-wider">最近の入店</p>
                <button onClick={() => router.push("/floor")} className="text-[11px] text-[#3a8f7c] hover:underline">入店管理→</button>
              </div>
              <div className="space-y-0">
                {recentEntries.map((e, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 border-b border-[#e8e4df] last:border-0">
                    <span className="text-[11px] text-[#8e9baa] font-mono w-10">{e.time}</span>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: RANK_DOT[e.rank] }} />
                    <span className="text-[12px] font-medium text-[#2c3e50]">{e.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

        if (s.id === "events") return (
          <div key={s.id}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-[#8e9baa] font-semibold uppercase tracking-wider">本日のイベント</p>
            </div>
            <div className="flex gap-3">
              {events.map((ev, i) => (
                <div key={i} className="flex items-center gap-3 flex-1 py-2 px-3 rounded-[6px] bg-white border border-[#e8e4df] hover:border-[#d8d3cc] transition-colors cursor-pointer">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[13px] font-semibold text-[#2c3e50]">{ev.title}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-[3px] font-semibold uppercase ${
                        ev.status === "進行中" ? "bg-[#e8f5f0] text-[#2e7d5b]" : "bg-[#fdf4e8] text-[#c87b1a]"
                      }`}>{ev.status}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#8e9baa]">
                      <Clock className="w-3 h-3" />{ev.time}
                      <Users className="w-3 h-3 ml-1" />{ev.participants}名
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

        return null;
      })}

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

function Metric({ label, value, color, onClick }: { label: string; value: string; color?: string; onClick?: () => void }) {
  return (
    <tr className={onClick ? "cursor-pointer hover:bg-[#f3f0ec] transition-colors" : ""} onClick={onClick}>
      <td className="py-1.5 pr-4 text-[#8e9baa] text-[12px]">{label}</td>
      <td className="py-1.5 text-right font-semibold" style={{ color: color ?? "#2c3e50" }}>{value}</td>
      {onClick && <td className="py-1.5 pl-2 w-4"><ChevronRight className="w-3 h-3 text-[#d8d3cc]" /></td>}
    </tr>
  );
}
