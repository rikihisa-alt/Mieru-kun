"use client";

import Image from "next/image";
import { useState } from "react";
import { useAppStore } from "@/lib/store/app-store";
import {
  Clock,
  CreditCard,
  Plus,
  UserPlus,
  MapPin,
  DoorOpen,
  AlertTriangle,
} from "lucide-react";

type Rank = "regular" | "silver" | "gold" | "vip";

interface Visitor {
  id: string;
  name: string;
  nickname: string;
  rank: Rank;
  checkInAt: string;
  table: string | null;
  amount: number;
  status: "active" | "unpaid" | "assigned";
  entranceFee: number;
  entrancePaid: boolean;
}

const RANK_LABELS: Record<Rank, string> = {
  regular: "レギュラー",
  silver: "シルバー",
  gold: "ゴールド",
  vip: "VIP",
};

const RANK_TEXT: Record<Rank, string> = {
  regular: "text-text-tertiary",
  silver: "text-[#475569]",
  gold: "text-status-warning",
  vip: "text-[#7c3aed]",
};
const RANK_SHORT: Record<Rank, string> = {
  regular: "Regular",
  silver: "SILVER",
  gold: "GOLD",
  vip: "VIP",
};

const PRESET_CUSTOMERS = [
  { name: "田中 太郎", nickname: "タロウ", rank: "gold" as Rank },
  { name: "佐藤 花子", nickname: "ハナコ", rank: "vip" as Rank },
  { name: "鈴木 一郎", nickname: "イチ", rank: "regular" as Rank },
  { name: "高橋 美咲", nickname: "ミィ", rank: "silver" as Rank },
  { name: "渡辺 健太", nickname: "ケンタ", rank: "regular" as Rank },
  { name: "伊藤 誠", nickname: "マコト", rank: "gold" as Rank },
  { name: "山本 さくら", nickname: "サクラ", rank: "vip" as Rank },
  { name: "中村 大輔", nickname: "ダイ", rank: "silver" as Rank },
];

function now() {
  return new Date().toISOString();
}

function timeAgo(isoStr: string): string {
  const diff = Math.round((Date.now() - new Date(isoStr).getTime()) / 60000);
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h > 0) return `${h}h${m}m`;
  return `${m}m`;
}

function formatTimeOnly(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

// エントランス料（ランク別プラン）
function entranceFeeByRank(rank: Rank): number {
  if (rank === "vip") return 0;
  if (rank === "gold" || rank === "silver") return 1000;
  return 1500;
}

const INITIAL_VISITORS: Visitor[] = [
  { id: "v1", name: "田中 太郎", nickname: "タロウ", rank: "gold", checkInAt: new Date(Date.now() - 90 * 60000).toISOString(), table: "VIP-1", amount: 45000, status: "active", entranceFee: 1000, entrancePaid: true },
  { id: "v2", name: "佐藤 花子", nickname: "ハナコ", rank: "vip", checkInAt: new Date(Date.now() - 120 * 60000).toISOString(), table: "VIP-2", amount: 82000, status: "active", entranceFee: 0, entrancePaid: true },
  { id: "v3", name: "鈴木 一郎", nickname: "イチ", rank: "regular", checkInAt: new Date(Date.now() - 45 * 60000).toISOString(), table: "A-3", amount: 12000, status: "active", entranceFee: 1500, entrancePaid: true },
  { id: "v4", name: "高橋 美咲", nickname: "ミィ", rank: "silver", checkInAt: new Date(Date.now() - 30 * 60000).toISOString(), table: "B-1", amount: 8500, status: "active", entranceFee: 1000, entrancePaid: false },
  { id: "v5", name: "渡辺 健太", nickname: "ケンタ", rank: "regular", checkInAt: new Date(Date.now() - 60 * 60000).toISOString(), table: null, amount: 0, status: "unpaid", entranceFee: 1500, entrancePaid: false },
  { id: "v6", name: "伊藤 誠", nickname: "マコト", rank: "gold", checkInAt: new Date(Date.now() - 15 * 60000).toISOString(), table: null, amount: 0, status: "active", entranceFee: 1000, entrancePaid: true },
  { id: "v7", name: "山本 さくら", nickname: "サクラ", rank: "vip", checkInAt: new Date(Date.now() - 10 * 60000).toISOString(), table: null, amount: 0, status: "active", entranceFee: 0, entrancePaid: true },
  { id: "v8", name: "中村 大輔", nickname: "ダイ", rank: "silver", checkInAt: new Date(Date.now() - 5 * 60000).toISOString(), table: null, amount: 0, status: "active", entranceFee: 1000, entrancePaid: false },
];

export default function FloorPage() {
  const appStore = useAppStore();
  const [visitors, setVisitors] = useState<Visitor[]>(INITIAL_VISITORS);
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [newName, setNewName] = useState("");
  const [newRank, setNewRank] = useState<Rank>("regular");
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [recentEntries, setRecentEntries] = useState<{ name: string; time: string }[]>(() => {
    const now = Date.now();
    return [
      { name: "ダイ", time: formatTimeOnly(new Date(now - 5 * 60000).toISOString()) },
      { name: "サクラ", time: formatTimeOnly(new Date(now - 10 * 60000).toISOString()) },
      { name: "マコト", time: formatTimeOnly(new Date(now - 15 * 60000).toISOString()) },
    ];
  });

  const activeCount = visitors.filter((v) => v.status === "active" || v.status === "assigned").length;
  const unassignedCount = visitors.filter((v) => v.table === null && v.status !== "unpaid").length;
  const unpaidCount = visitors.filter((v) => v.status === "unpaid").length;
  const entranceUnpaidCount = visitors.filter((v) => v.entranceFee > 0 && !v.entrancePaid).length;

  function markEntrancePaid(id: string) {
    setVisitors(prev => prev.map(v => v.id === id ? { ...v, entrancePaid: true } : v));
  }

  const assignedVisitors = visitors.filter((v) => v.table !== null);
  const unassignedVisitors = visitors.filter((v) => v.table === null && v.status !== "unpaid");

  function handleCheckIn() {
    let name = "";
    let nickname = "";
    let rank: Rank = "regular";

    if (showNewForm) {
      if (!newName.trim()) return;
      name = newName.trim();
      nickname = "";
      rank = newRank;
    } else {
      if (!selectedPreset) return;
      const preset = PRESET_CUSTOMERS.find((c) => c.name === selectedPreset);
      if (!preset) return;
      name = preset.name;
      nickname = preset.nickname;
      rank = preset.rank;
    }

    const existing = visitors.find((v) => v.name === name);
    if (existing) return;

    const newVisitor: Visitor = {
      id: `v${Date.now()}`,
      name,
      nickname,
      rank,
      checkInAt: now(),
      table: null,
      amount: 0,
      status: "active",
      entranceFee: entranceFeeByRank(rank),
      entrancePaid: entranceFeeByRank(rank) === 0,
    };

    setVisitors((prev) => [newVisitor, ...prev]);
    setRecentEntries((prev) => [
      { name: nickname || name, time: formatTimeOnly(now()) },
      ...prev.slice(0, 2),
    ]);
    // グローバルストアにも反映（ダッシュボード連動）
    try { appStore.addVisitor(nickname || name, rank); } catch { /* provider外の場合 */ }
    setSelectedPreset("");
    setNewName("");
    setNewRank("regular");
    setShowNewForm(false);
  }

  function handleSettle(id: string) {
    const v = visitors.find(x => x.id === id);
    if (v) { try { appStore.settleVisitor(id); } catch { /* */ } }
    setVisitors((prev) => prev.filter((v) => v.id !== id));
  }

  function handleAssign(id: string) {
    const tables = ["A-1", "A-2", "A-3", "B-1", "B-2", "VIP-1", "VIP-2"];
    const usedTables = visitors.filter((v) => v.table).map((v) => v.table);
    const available = tables.filter((t) => !usedTables.includes(t));
    const nextTable = available[0] || "A-1";

    setVisitors((prev) =>
      prev.map((v) =>
        v.id === id ? { ...v, table: nextTable, status: "assigned" as const } : v
      )
    );
  }

  function statusBadge(status: string) {
    switch (status) {
      case "active":   return "chip-success";
      case "unpaid":   return "chip-danger";
      case "assigned": return "chip-accent";
      default:         return "chip-neutral";
    }
  }

  function statusLabel(status: string) {
    switch (status) {
      case "active":
        return "来店中";
      case "unpaid":
        return "未払";
      case "assigned":
        return "配置済";
      default:
        return status;
    }
  }

  function isVipRow(rank: Rank) {
    return rank === "gold" || rank === "vip";
  }

  return (
    <div className="page-stack">
      {/* Top bar: 数値ストリップ + アクション */}
      <section>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="flex items-end gap-8 flex-wrap">
            <KpiItem label="来店" value={activeCount + unpaidCount} unit="名" />
            <KpiItem label="未配置" value={unassignedCount} unit="名" />
            <KpiItem label="未払" value={unpaidCount} unit="名" danger />
            <KpiItem label="エントランス未徴収" value={entranceUnpaidCount} unit="名" danger={entranceUnpaidCount > 0} />
          </div>
          <button
            onClick={() => { setShowNewForm(false); setSelectedPreset(""); setShowCheckinModal(true); }}
            className="btn btn-primary"
          >
            <UserPlus className="w-3.5 h-3.5" />入店登録
          </button>
        </div>
      </section>

      {/* 来店中 */}
      <section className="glass-panel">
        <p className="t-label mb-3">来店中</p>
        <table className="data-table">
          <thead>
            <tr>
              <th>ニックネーム / 本名</th>
              <th>ランク</th>
              <th>入店</th>
              <th>卓</th>
              <th>金額</th>
              <th>エントランス</th>
              <th>状態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {assignedVisitors.length === 0 && visitors.filter((v) => v.status === "unpaid").length === 0 && (
              <tr>
                <td colSpan={8} className="!py-10 text-center text-text-tertiary">
                  配置済の来店客はいません
                </td>
              </tr>
            )}
            {[...assignedVisitors, ...visitors.filter((v) => v.status === "unpaid")].map((v) => (
              <tr key={v.id} className="cursor-pointer">
                <td>
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium">{v.nickname || v.name}</span>
                    {v.nickname && <span className="text-[12px] text-text-tertiary">{v.name}</span>}
                  </div>
                </td>
                <td>
                  <span className={`text-[12px] font-semibold tracking-wider ${RANK_TEXT[v.rank]}`}>{RANK_SHORT[v.rank]}</span>
                </td>
                <td className="text-text-secondary">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 opacity-50" />
                    {formatTimeOnly(v.checkInAt)}
                    <span className="text-[12px] text-text-tertiary ml-1">({timeAgo(v.checkInAt)})</span>
                  </div>
                </td>
                <td>
                  {v.table ? (
                    <span className="chip chip-neutral chip-sm">{v.table}</span>
                  ) : (
                    <span className="text-text-tertiary">--</span>
                  )}
                </td>
                <td className="font-medium">
                  {v.amount > 0 ? `¥${v.amount.toLocaleString()}` : "--"}
                </td>
                <td>
                  {v.entranceFee === 0 ? (
                    <span className="text-[12px] text-text-tertiary">無料</span>
                  ) : v.entrancePaid ? (
                    <span className="inline-flex items-center gap-1 text-[12px] text-status-success">
                      <DoorOpen className="w-3 h-3" />
                      ¥{v.entranceFee.toLocaleString()}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[12px] text-status-danger" title="未徴収">
                      <AlertTriangle className="w-3 h-3" />
                      ¥{v.entranceFee.toLocaleString()} 未
                    </span>
                  )}
                </td>
                <td>
                  <span className={`chip chip-sm ${statusBadge(v.status)}`}>
                    {statusLabel(v.status)}
                  </span>
                </td>
                <td>
                  <div className="flex gap-1 flex-wrap">
                    {v.entranceFee > 0 && !v.entrancePaid && (
                      <button onClick={() => markEntrancePaid(v.id)} className="btn btn-subtle btn-xs" title="エントランス料を徴収済にする">
                        <DoorOpen className="w-3 h-3" />徴収
                      </button>
                    )}
                    <button onClick={() => handleSettle(v.id)} className="btn btn-subtle btn-xs">
                      <CreditCard className="w-3 h-3" />精算
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 未配置 */}
      {unassignedVisitors.length > 0 && (
        <section className="glass-panel">
          <p className="t-label mb-3">未配置 <span className="text-text-tertiary normal-case ml-1">({unassignedVisitors.length}名)</span></p>
          <div className="space-y-1">
            {unassignedVisitors.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between px-3 py-3 rounded-[var(--radius)] hover:bg-white/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="chip-dot !bg-[#209c6e]" />
                  <span className="text-[14px] font-medium text-text-primary">{v.nickname || v.name}</span>
                  {v.nickname && <span className="text-[12px] text-text-tertiary">{v.name}</span>}
                  <span className={`text-[12px] font-semibold tracking-wider ${RANK_TEXT[v.rank]}`}>{RANK_SHORT[v.rank]}</span>
                  <span className="text-[12px] text-text-tertiary">{formatTimeOnly(v.checkInAt)} 入店</span>
                </div>
                <button onClick={() => handleAssign(v.id)} className="btn btn-primary btn-sm">
                  <MapPin className="w-3 h-3" />配置
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
      {/* 入店登録モーダル */}
      {showCheckinModal && (
        <div className="modal-overlay z-50" onClick={() => setShowCheckinModal(false)}>
          <div className="modal-card modal-card-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="t-md flex items-center gap-2"><UserPlus className="w-4 h-4 text-[color:var(--primary-text)]" />入店登録</h3>
              <button onClick={() => setShowCheckinModal(false)} className="btn btn-ghost btn-xs"><span className="text-text-tertiary">✕</span></button>
            </div>
            {!showNewForm ? (
              <div className="space-y-3">
                <select value={selectedPreset} onChange={e => setSelectedPreset(e.target.value)}>
                  <option value="">顧客を選択...</option>
                  {PRESET_CUSTOMERS.filter(c => !visitors.find(v => v.name === c.name)).map(c => (
                    <option key={c.name} value={c.name}>{c.nickname}（{c.name}） - {RANK_LABELS[c.rank]}</option>
                  ))}
                </select>
                <button onClick={() => setShowNewForm(true)} className="btn btn-subtle btn-sm w-full">
                  <Plus className="w-3 h-3" />新規顧客
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="顧客名" />
                <select value={newRank} onChange={e => setNewRank(e.target.value as Rank)}>
                  <option value="regular">レギュラー</option><option value="silver">シルバー</option><option value="gold">ゴールド</option><option value="vip">VIP</option>
                </select>
                <button onClick={() => { setShowNewForm(false); setNewName(""); }} className="btn btn-ghost btn-sm">キャンセル</button>
              </div>
            )}
            <button onClick={() => { handleCheckIn(); setShowCheckinModal(false); }}
              className="w-full mt-3 py-2.5 bg-accent text-white text-[13px] font-medium rounded-[6px] hover:bg-accent-light hover:text-[#157a58] flex items-center justify-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" />入店する
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiItem({ label, value, unit, danger }: { label: string; value: string | number; unit?: string; danger?: boolean }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="t-label">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className="t-value" style={{ color: danger ? "var(--danger-text)" : "var(--text-primary)" }}>{value}</span>
        {unit && <span className="text-[14px] text-text-tertiary font-normal">{unit}</span>}
      </span>
    </div>
  );
}
