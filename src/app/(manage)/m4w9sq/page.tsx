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

const INITIAL_VISITORS: Visitor[] = [
  { id: "v1", name: "田中 太郎", nickname: "タロウ", rank: "gold", checkInAt: new Date(Date.now() - 90 * 60000).toISOString(), table: "VIP-1", amount: 45000, status: "active" },
  { id: "v2", name: "佐藤 花子", nickname: "ハナコ", rank: "vip", checkInAt: new Date(Date.now() - 120 * 60000).toISOString(), table: "VIP-2", amount: 82000, status: "active" },
  { id: "v3", name: "鈴木 一郎", nickname: "イチ", rank: "regular", checkInAt: new Date(Date.now() - 45 * 60000).toISOString(), table: "A-3", amount: 12000, status: "active" },
  { id: "v4", name: "高橋 美咲", nickname: "ミィ", rank: "silver", checkInAt: new Date(Date.now() - 30 * 60000).toISOString(), table: "B-1", amount: 8500, status: "active" },
  { id: "v5", name: "渡辺 健太", nickname: "ケンタ", rank: "regular", checkInAt: new Date(Date.now() - 60 * 60000).toISOString(), table: null, amount: 0, status: "unpaid" },
  { id: "v6", name: "伊藤 誠", nickname: "マコト", rank: "gold", checkInAt: new Date(Date.now() - 15 * 60000).toISOString(), table: null, amount: 0, status: "active" },
  { id: "v7", name: "山本 さくら", nickname: "サクラ", rank: "vip", checkInAt: new Date(Date.now() - 10 * 60000).toISOString(), table: null, amount: 0, status: "active" },
  { id: "v8", name: "中村 大輔", nickname: "ダイ", rank: "silver", checkInAt: new Date(Date.now() - 5 * 60000).toISOString(), table: null, amount: 0, status: "active" },
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
      case "active":
        return "bg-[#e6f4ea] text-status-success";
      case "unpaid":
        return "bg-status-danger-bg text-status-danger";
      case "assigned":
        return "bg-accent-light text-accent";
      default:
        return "bg-bg-hover text-text-secondary";
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
    <div className="space-y-4">
        {/* Top bar: counts */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="text-text-tertiary text-[13px]">来店</span>
            <span className="text-[15px] font-bold text-text-primary">{activeCount + unpaidCount}名</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-tertiary text-[13px]">未配置</span>
            <span className="text-[15px] font-bold text-text-primary">{unassignedCount}名</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-tertiary text-[13px]">未払</span>
            <span className="text-[15px] font-bold text-status-danger">{unpaidCount}名</span>
          </div>
          <button onClick={() => { setShowNewForm(false); setSelectedPreset(""); setShowCheckinModal(true); }}
            className="ml-auto flex items-center gap-1 px-4 py-2.5 bg-accent text-white text-[13px] font-medium rounded-[6px] hover:bg-accent-hover">
            <UserPlus className="w-3.5 h-3.5" />入店登録
          </button>
        </div>

        {/* Section A: Checked-in visitors */}
        <div>
          <h2 className="t-subhead mb-2">来店中</h2>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border-light">
                <th className="px-4 py-2 data-th">ニックネーム / 本名</th>
                <th className="px-4 py-2 data-th">ランク</th>
                <th className="px-4 py-2 data-th">入店</th>
                <th className="px-4 py-2 data-th">卓</th>
                <th className="px-4 py-2 data-th">金額</th>
                <th className="px-4 py-2 data-th">状態</th>
                <th className="px-4 py-2 data-th">操作</th>
              </tr>
            </thead>
            <tbody>
              {assignedVisitors.length === 0 && visitors.filter((v) => v.status === "unpaid").length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-tertiary text-[13px]">
                    配置済の来店客はいません
                  </td>
                </tr>
              )}
              {[...assignedVisitors, ...visitors.filter((v) => v.status === "unpaid")].map((v) => (
                <tr
                  key={v.id}
                  className={`border-b border-border-light hover:bg-bg-hover cursor-pointer transition-colors ${
                    isVipRow(v.rank) ? "bg-[#fffbeb]/30" : ""
                  }`}
                >
                  <td className="px-4 py-2.5 font-medium text-text-primary">
                    <div className="flex items-baseline gap-2">
                      <span>{v.nickname || v.name}</span>
                      {v.nickname && <span className="text-[11px] text-text-tertiary">{v.name}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[12px] font-semibold tracking-wider ${RANK_TEXT[v.rank]}`}>{RANK_SHORT[v.rank]}</span>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 opacity-50" />
                      {formatTimeOnly(v.checkInAt)}
                      <span className="text-[11px] text-text-tertiary ml-1">({timeAgo(v.checkInAt)})</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    {v.table ? (
                      <span className="inline-block px-2 py-0.5 bg-bg-hover rounded-[4px] text-[12px] font-medium text-text-primary">
                        {v.table}
                      </span>
                    ) : (
                      <span className="text-text-tertiary">--</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-text-primary">
                    {v.amount > 0 ? `¥${v.amount.toLocaleString()}` : "--"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline px-1.5 py-0.5 text-[10px] font-semibold rounded-[3px] ${statusBadge(v.status)}`}>
                      {statusLabel(v.status)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSettle(v.id)}
                        className="flex items-center gap-1 px-2 py-1 text-[12px] text-accent hover:bg-accent-light rounded-[4px] transition-colors"
                      >
                        <CreditCard className="w-3 h-3" />
                        精算
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section B: Unassigned */}
        {unassignedVisitors.length > 0 && (
          <div>
            <h2 className="t-subhead mb-2">未配置 ({unassignedVisitors.length}名)</h2>
            <div className="divide-y divide-[#f3f0ec]">
              {unassignedVisitors.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between px-4 py-3 border-l-2 border-l-[#3a8f7c] hover:bg-bg-hover transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-medium text-text-primary">{v.nickname || v.name}</span>
                    {v.nickname && <span className="text-[11px] text-text-tertiary">{v.name}</span>}
                    <span className={`text-[11px] font-semibold tracking-wider ${RANK_TEXT[v.rank]}`}>{RANK_SHORT[v.rank]}</span>
                    <span className="text-[12px] text-text-tertiary">
                      {formatTimeOnly(v.checkInAt)} 入店
                    </span>
                  </div>
                  <button
                    onClick={() => handleAssign(v.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-[#ffffff] bg-accent hover:bg-accent-hover rounded-[6px] transition-colors"
                  >
                    <MapPin className="w-3 h-3" />
                    配置
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      {/* 入店登録モーダル */}
      {showCheckinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowCheckinModal(false)}>
          <div className="bg-white rounded-[8px] w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold flex items-center gap-2"><UserPlus className="w-4 h-4 text-accent" />入店登録</h3>
              <button onClick={() => setShowCheckinModal(false)} className="p-1 hover:bg-bg-hover rounded-[4px]"><span className="text-text-tertiary text-[14px]">✕</span></button>
            </div>
            {!showNewForm ? (
              <div className="space-y-3">
                <select value={selectedPreset} onChange={e => setSelectedPreset(e.target.value)} className="text-[13px]">
                  <option value="">顧客を選択...</option>
                  {PRESET_CUSTOMERS.filter(c => !visitors.find(v => v.name === c.name)).map(c => (
                    <option key={c.name} value={c.name}>{c.nickname}（{c.name}） - {RANK_LABELS[c.rank]}</option>
                  ))}
                </select>
                <button onClick={() => setShowNewForm(true)} className="w-full text-left px-3 py-2 text-[12px] text-accent hover:bg-accent-light rounded-[6px] flex items-center gap-1">
                  <Plus className="w-3 h-3" />新規顧客
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="顧客名" className="text-[13px]" />
                <select value={newRank} onChange={e => setNewRank(e.target.value as Rank)} className="text-[13px]">
                  <option value="regular">レギュラー</option><option value="silver">シルバー</option><option value="gold">ゴールド</option><option value="vip">VIP</option>
                </select>
                <button onClick={() => { setShowNewForm(false); setNewName(""); }} className="text-[12px] text-text-secondary">キャンセル</button>
              </div>
            )}
            <button onClick={() => { handleCheckIn(); setShowCheckinModal(false); }}
              className="w-full mt-3 py-2.5 bg-accent text-white text-[13px] font-medium rounded-[6px] hover:bg-accent-hover flex items-center justify-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" />入店する
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
