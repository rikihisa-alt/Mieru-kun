"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  AlertTriangle,
  DollarSign,
  LayoutGrid,
  UserCheck,
  CalendarDays,
  TrendingUp,
  ShoppingBag,
  Clock,
  Settings2,
  X,
  GripVertical,
  ChevronRight,
} from "lucide-react";

// --- 型 ---
interface TableInfo { name: string; occupied: number; max: number; type: "vip" | "regular" | "semi-vip"; }
interface RecentEntry { name: string; time: string; rank: "regular" | "silver" | "gold" | "vip"; }
interface EventItem { title: string; time: string; status: "準備中" | "進行中" | "完了"; participants: number; }
interface DashSection { id: string; label: string; visible: boolean; }
interface AlertSetting { id: string; label: string; enabled: boolean; color: string; }

const RANK_DOT: Record<string, string> = { regular: "#9aa0a6", silver: "#5f6368", gold: "#f59e0b", vip: "#7c3aed" };

export default function DashboardPage() {
  const router = useRouter();

  // --- KPI ---
  const kpis = { visitors: 23, unpaid: 2, activeTables: 6, totalTables: 8, onDuty: 8, todayEvents: 2, sales: 185000, avgSpend: 8043, orders: 47, targetSales: 250000 };
  const tables: TableInfo[] = [
    { name: "VIP-1", occupied: 4, max: 6, type: "vip" }, { name: "VIP-2", occupied: 6, max: 6, type: "vip" },
    { name: "A-1", occupied: 3, max: 4, type: "regular" }, { name: "A-2", occupied: 0, max: 4, type: "regular" },
    { name: "A-3", occupied: 2, max: 4, type: "regular" }, { name: "B-1", occupied: 4, max: 4, type: "regular" },
    { name: "B-2", occupied: 0, max: 4, type: "regular" }, { name: "S-1", occupied: 3, max: 4, type: "semi-vip" },
  ];
  const recentEntries: RecentEntry[] = [
    { name: "田中 太郎", time: "21:30", rank: "gold" }, { name: "佐藤 花子", time: "21:15", rank: "vip" },
    { name: "鈴木 一郎", time: "20:45", rank: "regular" }, { name: "高橋 美咲", time: "20:30", rank: "silver" },
    { name: "渡辺 健太", time: "20:10", rank: "regular" },
  ];
  const events: EventItem[] = [
    { title: "VIPナイト", time: "20:00-24:00", status: "進行中", participants: 12 },
    { title: "新作カクテル試飲会", time: "22:00-23:00", status: "準備中", participants: 8 },
  ];

  // --- 設定パネル ---
  const [showSettings, setShowSettings] = useState(false);
  const [sections, setSections] = useState<DashSection[]>([
    { id: "kpi", label: "KPIパネル", visible: true },
    { id: "alerts", label: "アラート", visible: true },
    { id: "business", label: "営業状況", visible: true },
    { id: "tables", label: "卓稼働", visible: true },
    { id: "recent", label: "最近の入店", visible: true },
    { id: "events", label: "本日のイベント", visible: true },
  ]);
  const [alertSettings, setAlertSettings] = useState<AlertSetting[]>([
    { id: "unpaid", label: "未精算アラート", enabled: true, color: "#c5221f" },
    { id: "full_table", label: "満席アラート", enabled: true, color: "#e37400" },
    { id: "overtime", label: "長時間滞在アラート", enabled: false, color: "#1a73e8" },
  ]);

  function toggleSection(id: string) {
    setSections(prev => prev.map(s => s.id === id ? { ...s, visible: !s.visible } : s));
  }
  function toggleAlert(id: string) {
    setAlertSettings(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  }
  function moveSection(id: string, dir: -1 | 1) {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  }

  const isVisible = (id: string) => sections.find(s => s.id === id)?.visible ?? true;
  const progressPercent = Math.min(100, Math.round((kpis.sales / kpis.targetSales) * 100));

  const fullTables = tables.filter(t => t.occupied >= t.max).length;
  const unpaidAlert = alertSettings.find(a => a.id === "unpaid");
  const fullTableAlert = alertSettings.find(a => a.id === "full_table");

  // --- KPIクリックで遷移 ---
  const kpiItems = [
    { label: "来店数", value: `${kpis.visitors}名`, icon: <Users />, href: "/floor", color: "#1a73e8" },
    { label: "未払", value: `${kpis.unpaid}件`, icon: <AlertTriangle />, href: "/orders", color: kpis.unpaid > 0 ? "#c5221f" : "#1a1a1a", iconColor: kpis.unpaid > 0 ? "#c5221f" : "#9aa0a6" },
    { label: "稼働卓", value: `${kpis.activeTables}/${kpis.totalTables}卓`, icon: <LayoutGrid />, href: "/tables", color: "#1a1a1a" },
    { label: "出勤", value: `${kpis.onDuty}名`, icon: <UserCheck />, href: "/attendance", color: "#1a1a1a" },
    { label: "本日イベント", value: `${kpis.todayEvents}件`, icon: <CalendarDays />, href: "/tables", color: "#1a1a1a" },
  ];

  // --- セクション描画マップ ---
  const sectionRenderers: Record<string, () => React.ReactNode> = {
    kpi: () => (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {kpiItems.map((k, i) => (
          <div key={i} onClick={() => router.push(k.href)}
            className="bg-white border border-[#dadce0] rounded-[8px] px-4 py-3.5 cursor-pointer hover:border-[#1a73e8]/40 transition-colors group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: k.iconColor ?? "#9aa0a6" }} className="[&>svg]:w-[14px] [&>svg]:h-[14px]">{k.icon}</span>
                <span className="text-[11px] text-[#9aa0a6] font-medium">{k.label}</span>
              </div>
              <ChevronRight className="w-3 h-3 text-[#dadce0] group-hover:text-[#1a73e8] transition-colors" />
            </div>
            <p className="text-[20px] font-bold tracking-tight" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>
    ),
    alerts: () => {
      const alerts: { msg: string; color: string; href: string }[] = [];
      if (unpaidAlert?.enabled && kpis.unpaid > 0) alerts.push({ msg: `未精算 ${kpis.unpaid}件 — 精算処理が必要です`, color: unpaidAlert.color, href: "/orders" });
      if (fullTableAlert?.enabled && fullTables > 0) alerts.push({ msg: `満席卓 ${fullTables}卓 — 卓管理を確認してください`, color: fullTableAlert.color, href: "/tables" });
      if (alerts.length === 0) return null;
      return (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} onClick={() => router.push(a.href)}
              className="flex items-center gap-2 px-4 py-3 rounded-[8px] text-[13px] cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: a.color + "15", border: `1px solid ${a.color}30` }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: a.color }} />
              <span className="font-medium" style={{ color: a.color }}>{a.msg}</span>
              <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: a.color }} />
            </div>
          ))}
        </div>
      );
    },
    business: () => (
      <div className="bg-white border border-[#dadce0] rounded-[8px] p-4">
        <h2 className="text-[14px] font-semibold mb-4">営業状況</h2>
        <div className="space-y-3">
          <Row icon={<DollarSign />} label="売上" value={`¥${kpis.sales.toLocaleString()}`} bold />
          <Row icon={<Users />} label="来店" value={`${kpis.visitors}名`} />
          <Row icon={<TrendingUp />} label="客単価" value={`¥${kpis.avgSpend.toLocaleString()}`} />
          <Row icon={<ShoppingBag />} label="注文" value={`${kpis.orders}件`} />
          <div className="pt-2 mt-1 border-t border-[#e8eaed]">
            <div className="flex items-center justify-between text-[12px] mb-1.5">
              <span className="text-[#9aa0a6]">目標達成率</span>
              <span className="font-bold text-[#1a73e8]">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-[#e8eaed] rounded-full overflow-hidden">
              <div className="h-full bg-[#1a73e8] rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="text-[11px] text-[#9aa0a6] mt-1">目標 ¥{kpis.targetSales.toLocaleString()}</p>
          </div>
        </div>
      </div>
    ),
    tables: () => (
      <div className="bg-white border border-[#dadce0] rounded-[8px] p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold">卓稼働</h2>
          <button onClick={() => router.push("/tables")} className="text-[12px] text-[#1a73e8] hover:underline">詳細 →</button>
        </div>
        <div className="space-y-2">
          {tables.map(t => {
            const pct = t.max > 0 ? t.occupied / t.max : 0;
            const c = pct >= 1 ? "#c5221f" : pct >= 0.75 ? "#f59e0b" : t.occupied > 0 ? "#188038" : "#9aa0a6";
            return (
              <div key={t.name} className="flex items-center gap-2 text-[12px]">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                <span className="font-medium w-12">{t.name}</span>
                <div className="flex-1 h-1.5 bg-[#e8eaed] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, backgroundColor: c }} />
                </div>
                <span className="text-[#5f6368] w-10 text-right">{t.occupied}/{t.max}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-[4px] font-medium ${t.type === "vip" ? "bg-[#f3e8fd] text-[#7c3aed]" : t.type === "semi-vip" ? "bg-[#fef3c7] text-[#d97706]" : "bg-[#f5f6f8] text-[#5f6368]"}`}>
                  {t.type === "vip" ? "VIP" : t.type === "semi-vip" ? "S-VIP" : "一般"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    ),
    recent: () => (
      <div className="bg-white border border-[#dadce0] rounded-[8px] p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold">最近の入店</h2>
          <button onClick={() => router.push("/floor")} className="text-[12px] text-[#1a73e8] hover:underline">入店管理 →</button>
        </div>
        <div className="space-y-2">
          {recentEntries.map((e, i) => (
            <div key={i} className="flex items-center gap-2.5 text-[12px]">
              <span className="text-[#9aa0a6] font-mono w-10">{e.time}</span>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: RANK_DOT[e.rank] }} />
              <span className="font-medium">{e.name}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    events: () => (
      <div className="bg-white border border-[#dadce0] rounded-[8px] p-4">
        <h2 className="text-[14px] font-semibold mb-3">本日のイベント</h2>
        <div className="space-y-2">
          {events.map((ev, i) => (
            <div key={i} className="border border-[#e8eaed] rounded-[6px] px-3 py-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px] font-medium">{ev.title}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-[4px] font-medium ${ev.status === "進行中" ? "bg-[#e6f4ea] text-[#188038]" : ev.status === "準備中" ? "bg-[#fef3c7] text-[#d97706]" : "bg-[#e8f0fe] text-[#1a73e8]"}`}>{ev.status}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[#9aa0a6]">
                <span><Clock className="w-3 h-3 inline mr-0.5" />{ev.time}</span>
                <span><Users className="w-3 h-3 inline mr-0.5" />{ev.participants}名</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  };

  return (
    <div className="space-y-4 relative">
      {/* 設定ボタン */}
      <div className="flex items-center justify-between">
        <div />
        <button onClick={() => setShowSettings(true)} className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] text-[#5f6368] hover:bg-[#f0f1f3] rounded-[6px] transition-colors">
          <Settings2 className="w-3.5 h-3.5" />表示設定
        </button>
      </div>

      {/* セクション描画 */}
      {(() => {
        const visible = sections.filter(s => s.visible);
        const elements: React.ReactNode[] = [];
        let i = 0;
        while (i < visible.length) {
          const s = visible[i];
          const renderer = sectionRenderers[s.id];
          if (!renderer) { i++; continue; }
          const content = renderer();
          if (!content) { i++; continue; }

          // business+tables, recent+events を2カラムにペアリング
          const pairIds = [["business", "tables"], ["recent", "events"]];
          const pair = pairIds.find(p => p[0] === s.id);
          if (pair) {
            const nextS = visible.find(x => x.id === pair[1]);
            const nextContent = nextS ? sectionRenderers[nextS.id]?.() : null;
            elements.push(
              <div key={s.id} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>{content}</div>
                {nextContent && <div>{nextContent}</div>}
              </div>
            );
            // ペア相手をスキップ
            if (nextS) {
              const skipIdx = visible.findIndex(x => x.id === nextS.id);
              if (skipIdx > i) {
                visible.splice(skipIdx, 1);
              }
            }
          } else if (!pairIds.some(p => p[1] === s.id)) {
            // ペア右側として既に描画済みでなければ描画
            elements.push(<div key={s.id}>{content}</div>);
          }
          i++;
        }
        return elements;
      })()}

      {/* 設定パネル（オーバーレイ） */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onClick={() => setShowSettings(false)}>
          <div className="w-80 bg-white h-full shadow-lg overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#dadce0]">
              <span className="text-[14px] font-semibold">ダッシュボード設定</span>
              <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-[#f0f1f3] rounded-[4px]"><X className="w-4 h-4 text-[#5f6368]" /></button>
            </div>

            {/* セクション表示/非表示 + 順序 */}
            <div className="p-4">
              <p className="text-[11px] font-semibold text-[#9aa0a6] uppercase tracking-wider mb-2">表示セクション</p>
              <div className="space-y-1.5">
                {sections.map((s, idx) => (
                  <div key={s.id} className="flex items-center gap-2 px-2 py-1.5 rounded-[4px] hover:bg-[#f5f6f8]">
                    <GripVertical className="w-3 h-3 text-[#dadce0]" />
                    <label className="flex items-center gap-2 flex-1 cursor-pointer">
                      <input type="checkbox" checked={s.visible} onChange={() => toggleSection(s.id)} className="accent-[#1a73e8]" />
                      <span className="text-[12px]">{s.label}</span>
                    </label>
                    <div className="flex gap-0.5">
                      <button onClick={() => moveSection(s.id, -1)} disabled={idx === 0} className="text-[10px] px-1 text-[#9aa0a6] disabled:opacity-30">↑</button>
                      <button onClick={() => moveSection(s.id, 1)} disabled={idx === sections.length - 1} className="text-[10px] px-1 text-[#9aa0a6] disabled:opacity-30">↓</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* アラート設定 */}
            <div className="p-4 border-t border-[#e8eaed]">
              <p className="text-[11px] font-semibold text-[#9aa0a6] uppercase tracking-wider mb-2">アラート設定</p>
              <div className="space-y-2">
                {alertSettings.map(a => (
                  <div key={a.id} className="flex items-center gap-2 px-2 py-1.5 rounded-[4px] hover:bg-[#f5f6f8]">
                    <label className="flex items-center gap-2 flex-1 cursor-pointer">
                      <input type="checkbox" checked={a.enabled} onChange={() => toggleAlert(a.id)} className="accent-[#1a73e8]" />
                      <span className="text-[12px]">{a.label}</span>
                    </label>
                    <div className="w-4 h-4 rounded-[3px] border border-[#dadce0]" style={{ backgroundColor: a.color }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ icon, label, value, bold }: { icon: React.ReactNode; label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-[#5f6368] flex items-center gap-2"><span className="[&>svg]:w-3.5 [&>svg]:h-3.5 text-[#9aa0a6]">{icon}</span>{label}</span>
      <span className={bold ? "font-bold" : "font-medium"}>{value}</span>
    </div>
  );
}
