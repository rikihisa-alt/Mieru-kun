"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings2, X, GripVertical, AlertTriangle, ArrowUpRight,
  DoorOpen, LogIn, LogOut as LogOutIcon, CalendarDays, ShoppingBag, Coins, CreditCard,
} from "lucide-react";
import { useAppStore } from "@/lib/store/app-store";

interface DashSection { id: string; label: string; visible: boolean; }
interface AlertSetting { id: string; label: string; enabled: boolean; }

export default function DashboardPage() {
  const router = useRouter();
  const { kpis, tables, timeline, events } = useAppStore();

  const progressPct = Math.min(100, Math.round((kpis.sales / kpis.targetSales) * 100));

  const [showSettings, setShowSettings] = useState(false);
  const [sections, setSections] = useState<DashSection[]>([
    { id: "summary", label: "本日集計", visible: true },
    { id: "alerts", label: "要対応", visible: true },
    { id: "tables", label: "卓稼働", visible: true },
    { id: "timeline", label: "タイムライン", visible: true },
  ]);
  const [alertSettings, setAlertSettings] = useState<AlertSetting[]>([
    { id: "unpaid", label: "未精算アラート", enabled: true },
    { id: "full_table", label: "満席アラート", enabled: true },
  ]);

  function toggleSection(id: string) { setSections(p => p.map(s => s.id === id ? { ...s, visible: !s.visible } : s)); }
  function toggleAlert(id: string) { setAlertSettings(p => p.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a)); }
  function moveSection(id: string, dir: -1 | 1) {
    setSections(p => { const i = p.findIndex(s => s.id === id); if (i < 0) return p; const n = i + dir; if (n < 0 || n >= p.length) return p; const a = [...p]; [a[i], a[n]] = [a[n], a[i]]; return a; });
  }

  const fullTables = tables.filter(t => t.occupied >= t.max).length;
  const isVisible = (id: string) => sections.find(s => s.id === id)?.visible ?? true;
  const hasUnpaidAlert = alertSettings.find(a => a.id === "unpaid")?.enabled && kpis.unpaid > 0;
  const hasFullAlert = alertSettings.find(a => a.id === "full_table")?.enabled && fullTables > 0;

  const TYPE_ICON: Record<string, { icon: React.ReactNode; chip: string }> = {
    "入店":      { icon: <DoorOpen className="w-3.5 h-3.5" />,  chip: "chip chip-success" },
    "退店":      { icon: <LogOutIcon className="w-3.5 h-3.5" />, chip: "chip chip-neutral" },
    "出勤":      { icon: <LogIn className="w-3.5 h-3.5" />,     chip: "chip chip-accent" },
    "退勤":      { icon: <LogOutIcon className="w-3.5 h-3.5" />, chip: "chip chip-neutral" },
    "注文":      { icon: <ShoppingBag className="w-3.5 h-3.5" />,chip: "chip chip-success" },
    "精算":      { icon: <CreditCard className="w-3.5 h-3.5" />, chip: "chip chip-success" },
    "チップ":    { icon: <Coins className="w-3.5 h-3.5" />,     chip: "chip chip-warning" },
    "イベント":  { icon: <CalendarDays className="w-3.5 h-3.5" />,chip: "chip chip-vip" },
  };

  return (
    <div className="page-stack relative">
      {/* 設定ボタン */}
      <button
        onClick={() => setShowSettings(true)}
        className="absolute top-0 right-0 btn btn-ghost btn-xs"
      >
        <Settings2 className="w-3.5 h-3.5" />
      </button>

      {/* ===== 本日集計 (横一列、枠なし、数字強調) ===== */}
      {isVisible("summary") && (
        <section>
          <p className="t-label mb-3">本日集計</p>
          <div className="flex items-end gap-8 flex-wrap">
            <KpiItem label="来店"     value={kpis.visitors}                     unit="名"  onClick={() => router.push("/m4w9sq")} />
            <KpiItem label="売上"     value={`¥${kpis.sales.toLocaleString()}`} />
            <KpiItem label="客単価"   value={`¥${kpis.avgSpend.toLocaleString()}`} />
            <KpiItem label="達成率"   value={`${progressPct}%`} accent />
            <KpiItem label="出勤"     value={kpis.onDuty}                       unit="名" onClick={() => router.push("/z5b7lc")} />
            {kpis.unpaid > 0 && (
              <KpiItem label="未払" value={kpis.unpaid} unit="件" danger onClick={() => router.push("/x6j2fp")} />
            )}
          </div>
        </section>
      )}

      {/* ===== 要対応 ===== */}
      {isVisible("alerts") && (hasUnpaidAlert || hasFullAlert) && (
        <section>
          <p className="t-label mb-3">要対応</p>
          <div className="space-y-2">
            {hasUnpaidAlert && (
              <AlertRow
                tone="danger"
                text={`未精算 ${kpis.unpaid}件 — 精算処理が必要です`}
                onClick={() => router.push("/x6j2fp")}
              />
            )}
            {hasFullAlert && (
              <AlertRow
                tone="warning"
                text={`満席卓 ${fullTables}卓 — 卓管理を確認してください`}
                onClick={() => router.push("/v3r8nb")}
              />
            )}
          </div>
        </section>
      )}

      {/* ===== 卓稼働 + タイムライン (2カラム) ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
        {isVisible("tables") && (
          <section className="glass-panel">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-baseline gap-3">
                <h2 className="t-md">卓稼働</h2>
                <span className="t-xs text-text-tertiary">{kpis.activeTables} / {kpis.totalTables}</span>
              </div>
              <button onClick={() => router.push("/v3r8nb")} className="btn btn-ghost btn-xs">
                卓管理 <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {tables.map((t) => {
                const pct = t.max > 0 ? (t.occupied / t.max) * 100 : 0;
                const full = pct >= 100; const empty = t.occupied === 0;
                return (
                  <button
                    key={t.name}
                    onClick={() => router.push("/v3r8nb")}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius)] hover:bg-white/60 transition-colors text-left"
                  >
                    <span className={`chip-dot ${full ? "!bg-[#c0392b]" : empty ? "!bg-[rgba(28,46,60,0.15)]" : "!bg-[#209c6e]"}`} />
                    <span className="flex-1 text-[14px] font-medium">{t.name}</span>
                    <span className="t-xs text-text-tertiary">{t.type}</span>
                    <span className="text-[14px] font-semibold tabular-nums min-w-[4em] text-right">
                      {t.occupied} / {t.max}
                    </span>
                    <div className="w-16 h-[3px] rounded-full bg-[rgba(28,46,60,0.08)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: full ? "#c0392b" : empty ? "transparent" : "#209c6e",
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {isVisible("timeline") && (
          <section className="glass-panel">
            <div className="flex items-center justify-between mb-4">
              <h2 className="t-md">タイムライン</h2>
              <button onClick={() => router.push("/n3k8xh")} className="btn btn-ghost btn-xs">
                すべての履歴 <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {events.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-3 mb-3 border-b border-border-light">
                {events.map((ev, i) => {
                  const cls = ev.status === "進行中" ? "chip chip-success" : ev.status === "準備中" ? "chip chip-warning" : "chip chip-neutral";
                  return (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius)] bg-white/40 border border-glass-border flex-shrink-0 whitespace-nowrap">
                      <span className={`${cls} chip-sm`}>{ev.status}</span>
                      <span className="text-[14px] font-medium">{ev.title}</span>
                      <span className="t-xs text-text-tertiary">{ev.time} / {ev.participants}名</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="relative max-h-[460px] overflow-y-auto scrollbar-subtle">
              <div className="space-y-1">
                {timeline.map((ev, i) => {
                  const meta = TYPE_ICON[ev.type] ?? TYPE_ICON["入店"];
                  return (
                    <button
                      key={i}
                      onClick={() =>
                        router.push(
                          ev.type === "入店" || ev.type === "退店" ? "/m4w9sq" :
                          ev.type === "注文" || ev.type === "精算" ? "/x6j2fp" :
                          ev.type === "チップ" ? "/a9k5dm" :
                          ev.type === "イベント" ? "/v3r8nb" : "/z5b7lc"
                        )
                      }
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-[var(--radius)] hover:bg-white/60 transition-colors text-left"
                    >
                      <span className="t-xs text-text-tertiary font-mono w-10 flex-shrink-0">{ev.time}</span>
                      <span className={meta.chip + " chip-sm flex-shrink-0"}>
                        <span className="opacity-75">{meta.icon}</span>
                        {ev.type}
                      </span>
                      <span className="text-[14px] font-medium truncate">{ev.name}</span>
                      {ev.realName && <span className="t-xs text-text-tertiary flex-shrink-0">（{ev.realName}）</span>}
                      {ev.detail && <span className="t-xs text-text-tertiary truncate">{ev.detail}</span>}
                      {ev.amount != null && (
                        <span className="ml-auto text-[14px] font-semibold tabular-nums flex-shrink-0">¥{ev.amount.toLocaleString()}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* 設定ドロワー */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(28,46,60,0.18)", backdropFilter: "blur(6px)" }} onClick={() => setShowSettings(false)}>
          <div className="w-80 h-full bg-white/90 backdrop-blur-xl border-l border-glass-border overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
              <span className="t-md">表示設定</span>
              <button onClick={() => setShowSettings(false)} className="btn btn-ghost btn-xs">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-1">
              {sections.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-2 px-2 py-2 rounded-[var(--radius-sm)] hover:bg-white/60">
                  <GripVertical className="w-3 h-3 text-text-tertiary" />
                  <label className="flex items-center gap-2 flex-1 cursor-pointer">
                    <input type="checkbox" checked={s.visible} onChange={() => toggleSection(s.id)} className="!w-4 !h-4 accent-[#209c6e]" />
                    <span className="text-[14px]">{s.label}</span>
                  </label>
                  <div className="flex gap-0.5">
                    <button onClick={() => moveSection(s.id, -1)} disabled={idx === 0} className="text-[12px] px-1.5 text-text-tertiary disabled:opacity-30">↑</button>
                    <button onClick={() => moveSection(s.id, 1)} disabled={idx === sections.length - 1} className="text-[12px] px-1.5 text-text-tertiary disabled:opacity-30">↓</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 pb-5 space-y-1 border-t border-border-light pt-4">
              <p className="t-label mb-2">アラート</p>
              {alertSettings.map((a) => (
                <label key={a.id} className="flex items-center gap-2 px-2 py-2 cursor-pointer hover:bg-white/60 rounded-[var(--radius-sm)]">
                  <input type="checkbox" checked={a.enabled} onChange={() => toggleAlert(a.id)} className="!w-4 !h-4 accent-[#209c6e]" />
                  <span className="text-[14px]">{a.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiItem({
  label, value, unit, accent, danger, onClick,
}: {
  label: string;
  value: string | number;
  unit?: string;
  accent?: boolean;
  danger?: boolean;
  onClick?: () => void;
}) {
  const valueColor = danger ? "var(--danger-text)" : accent ? "var(--primary-text)" : "var(--text-primary)";
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`flex flex-col items-start gap-1 ${onClick ? "cursor-pointer hover:opacity-75" : "cursor-default"} transition-opacity`}
    >
      <span className="t-label">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className="t-value" style={{ color: valueColor }}>{value}</span>
        {unit && <span className="text-[14px] text-text-tertiary font-normal">{unit}</span>}
      </span>
    </button>
  );
}

function AlertRow({ tone, text, onClick }: { tone: "danger" | "warning"; text: string; onClick?: () => void }) {
  const bg = tone === "danger" ? "var(--danger-soft-bg)" : "var(--warning-soft-bg)";
  const color = tone === "danger" ? "var(--danger-text)" : "var(--warning-text)";
  const border = tone === "danger" ? "rgba(220,60,60,0.20)" : "rgba(255,170,0,0.25)";
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-4 py-3 rounded-[var(--radius)] text-left transition-all hover:brightness-[1.02]"
      style={{ background: bg, color, border: `1px solid ${border}`, backdropFilter: "blur(6px)" }}
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span className="text-[14px] font-medium">{text}</span>
      <ArrowUpRight className="w-3.5 h-3.5 ml-auto" />
    </button>
  );
}
