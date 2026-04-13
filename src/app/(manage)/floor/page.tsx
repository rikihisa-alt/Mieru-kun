"use client";

import { useState } from "react";
import {
  Users,
  Clock,
  CreditCard,
  Plus,
  UserPlus,
  ChevronDown,
  AlertCircle,
  MapPin,
} from "lucide-react";

type Rank = "regular" | "silver" | "gold" | "vip";

interface Visitor {
  id: string;
  name: string;
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

const RANK_DOT_COLORS: Record<Rank, string> = {
  regular: "#9aa0a6",
  silver: "#5f6368",
  gold: "#f59e0b",
  vip: "#7c3aed",
};

const PRESET_CUSTOMERS = [
  { name: "田中 太郎", rank: "gold" as Rank },
  { name: "佐藤 花子", rank: "vip" as Rank },
  { name: "鈴木 一郎", rank: "regular" as Rank },
  { name: "高橋 美咲", rank: "silver" as Rank },
  { name: "渡辺 健太", rank: "regular" as Rank },
  { name: "伊藤 誠", rank: "gold" as Rank },
  { name: "山本 さくら", rank: "vip" as Rank },
  { name: "中村 大輔", rank: "silver" as Rank },
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
  { id: "v1", name: "田中 太郎", rank: "gold", checkInAt: new Date(Date.now() - 90 * 60000).toISOString(), table: "VIP-1", amount: 45000, status: "active" },
  { id: "v2", name: "佐藤 花子", rank: "vip", checkInAt: new Date(Date.now() - 120 * 60000).toISOString(), table: "VIP-2", amount: 82000, status: "active" },
  { id: "v3", name: "鈴木 一郎", rank: "regular", checkInAt: new Date(Date.now() - 45 * 60000).toISOString(), table: "A-3", amount: 12000, status: "active" },
  { id: "v4", name: "高橋 美咲", rank: "silver", checkInAt: new Date(Date.now() - 30 * 60000).toISOString(), table: "B-1", amount: 8500, status: "active" },
  { id: "v5", name: "渡辺 健太", rank: "regular", checkInAt: new Date(Date.now() - 60 * 60000).toISOString(), table: null, amount: 0, status: "unpaid" },
  { id: "v6", name: "伊藤 誠", rank: "gold", checkInAt: new Date(Date.now() - 15 * 60000).toISOString(), table: null, amount: 0, status: "active" },
  { id: "v7", name: "山本 さくら", rank: "vip", checkInAt: new Date(Date.now() - 10 * 60000).toISOString(), table: null, amount: 0, status: "active" },
  { id: "v8", name: "中村 大輔", rank: "silver", checkInAt: new Date(Date.now() - 5 * 60000).toISOString(), table: null, amount: 0, status: "active" },
];

export default function FloorPage() {
  const [visitors, setVisitors] = useState<Visitor[]>(INITIAL_VISITORS);
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [newName, setNewName] = useState("");
  const [newRank, setNewRank] = useState<Rank>("regular");
  const [recentEntries, setRecentEntries] = useState<{ name: string; time: string }[]>([
    { name: "中村 大輔", time: formatTimeOnly(new Date(Date.now() - 5 * 60000).toISOString()) },
    { name: "山本 さくら", time: formatTimeOnly(new Date(Date.now() - 10 * 60000).toISOString()) },
    { name: "伊藤 誠", time: formatTimeOnly(new Date(Date.now() - 15 * 60000).toISOString()) },
  ]);

  const activeCount = visitors.filter((v) => v.status === "active" || v.status === "assigned").length;
  const unassignedCount = visitors.filter((v) => v.table === null && v.status !== "unpaid").length;
  const unpaidCount = visitors.filter((v) => v.status === "unpaid").length;

  const assignedVisitors = visitors.filter((v) => v.table !== null);
  const unassignedVisitors = visitors.filter((v) => v.table === null && v.status !== "unpaid");

  function handleCheckIn() {
    let name = "";
    let rank: Rank = "regular";

    if (showNewForm) {
      if (!newName.trim()) return;
      name = newName.trim();
      rank = newRank;
    } else {
      if (!selectedPreset) return;
      const preset = PRESET_CUSTOMERS.find((c) => c.name === selectedPreset);
      if (!preset) return;
      name = preset.name;
      rank = preset.rank;
    }

    const existing = visitors.find((v) => v.name === name);
    if (existing) return;

    const newVisitor: Visitor = {
      id: `v${Date.now()}`,
      name,
      rank,
      checkInAt: now(),
      table: null,
      amount: 0,
      status: "active",
    };

    setVisitors((prev) => [newVisitor, ...prev]);
    setRecentEntries((prev) => [
      { name, time: formatTimeOnly(now()) },
      ...prev.slice(0, 2),
    ]);
    setSelectedPreset("");
    setNewName("");
    setNewRank("regular");
    setShowNewForm(false);
  }

  function handleSettle(id: string) {
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
        return "bg-[#e6f4ea] text-[#1e7e34]";
      case "unpaid":
        return "bg-[#fce8e6] text-[#c5221f]";
      case "assigned":
        return "bg-[#e8f5f0] text-[#3a8f7c]";
      default:
        return "bg-[#faf8f5] text-[#5a6977]";
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
    <div className="flex gap-4 max-w-full" style={{ minHeight: "calc(100vh - 120px)" }}>
      {/* Left side - Main content */}
      <div className="flex-1 space-y-4 min-w-0">
        {/* Top bar: counts */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#ffffff] border border-[#d8d3cc] rounded-[6px] px-4 py-2.5">
            <Users className="w-4 h-4 text-[#3a8f7c]" />
            <span className="text-[13px] text-[#5a6977]">来店</span>
            <span className="text-[20px] font-bold text-[#2c3e50] ml-1">{activeCount + unpaidCount}名</span>
          </div>
          <div className="flex items-center gap-2 bg-[#ffffff] border border-[#d8d3cc] rounded-[6px] px-4 py-2.5">
            <MapPin className="w-4 h-4 text-[#f59e0b]" />
            <span className="text-[13px] text-[#5a6977]">未配置</span>
            <span className="text-[20px] font-bold text-[#2c3e50] ml-1">{unassignedCount}名</span>
          </div>
          <div className="flex items-center gap-2 bg-[#ffffff] border border-[#d8d3cc] rounded-[6px] px-4 py-2.5">
            <AlertCircle className="w-4 h-4 text-[#c5221f]" />
            <span className="text-[13px] text-[#5a6977]">未払</span>
            <span className="text-[20px] font-bold text-[#c5221f] ml-1">{unpaidCount}名</span>
          </div>
        </div>

        {/* Section A: Checked-in visitors */}
        <div className="bg-[#ffffff] border border-[#d8d3cc] rounded-[8px] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#d8d3cc] bg-[#faf8f5]">
            <h2 className="text-[14px] font-semibold text-[#2c3e50]">来店中</h2>
          </div>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#d8d3cc] bg-[#faf8f5]">
                <th className="px-4 py-2 text-left text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider">顧客名</th>
                <th className="px-4 py-2 text-left text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider">ランク</th>
                <th className="px-4 py-2 text-left text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider">入店</th>
                <th className="px-4 py-2 text-left text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider">卓</th>
                <th className="px-4 py-2 text-left text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider">金額</th>
                <th className="px-4 py-2 text-left text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider">状態</th>
                <th className="px-4 py-2 text-left text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody>
              {assignedVisitors.length === 0 && visitors.filter((v) => v.status === "unpaid").length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#8e9baa] text-[13px]">
                    配置済の来店客はいません
                  </td>
                </tr>
              )}
              {[...assignedVisitors, ...visitors.filter((v) => v.status === "unpaid")].map((v) => (
                <tr
                  key={v.id}
                  className={`border-b border-[#f0f0f0] hover:bg-[#f8f9fa] transition-colors ${
                    isVipRow(v.rank) ? "bg-[#fffbeb]/30" : ""
                  }`}
                >
                  <td className="px-4 py-2.5 font-medium text-[#2c3e50]">
                    <div className="flex items-center gap-2">
                      {v.name}
                      {(v.rank === "vip" || v.rank === "gold") && (
                        <span className={`inline px-1.5 py-0.5 text-[10px] font-medium rounded-[4px] ${
                          v.rank === "vip" ? "bg-[#f3e8fd] text-[#7c3aed]" : "bg-[#fef3c7] text-[#d97706]"
                        }`}>
                          {RANK_LABELS[v.rank]}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className="inline-block w-[8px] h-[8px] rounded-full"
                      style={{ backgroundColor: RANK_DOT_COLORS[v.rank] }}
                      title={RANK_LABELS[v.rank]}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-[#5a6977]">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 opacity-50" />
                      {formatTimeOnly(v.checkInAt)}
                      <span className="text-[11px] text-[#8e9baa] ml-1">({timeAgo(v.checkInAt)})</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    {v.table ? (
                      <span className="inline-block px-2 py-0.5 bg-[#faf8f5] rounded-[4px] text-[12px] font-medium text-[#2c3e50]">
                        {v.table}
                      </span>
                    ) : (
                      <span className="text-[#8e9baa]">--</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-[#2c3e50]">
                    {v.amount > 0 ? `¥${v.amount.toLocaleString()}` : "--"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline px-2 py-0.5 text-[11px] font-medium rounded-[4px] ${statusBadge(v.status)}`}>
                      {statusLabel(v.status)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSettle(v.id)}
                        className="flex items-center gap-1 px-2 py-1 text-[12px] text-[#3a8f7c] hover:bg-[#e8f5f0] rounded-[4px] transition-colors"
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
          <div className="bg-[#ffffff] border border-[#d8d3cc] rounded-[8px] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#d8d3cc] bg-[#faf8f5]">
              <h2 className="text-[14px] font-semibold text-[#2c3e50]">未配置 ({unassignedVisitors.length}名)</h2>
            </div>
            <div className="divide-y divide-[#f0f0f0]">
              {unassignedVisitors.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between px-4 py-3 border-l-2 border-l-[#3a8f7c] hover:bg-[#f8f9fa] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-block w-[8px] h-[8px] rounded-full"
                      style={{ backgroundColor: RANK_DOT_COLORS[v.rank] }}
                    />
                    <span className="text-[13px] font-medium text-[#2c3e50]">{v.name}</span>
                    {(v.rank === "vip" || v.rank === "gold") && (
                      <span className={`inline px-1.5 py-0.5 text-[10px] font-medium rounded-[4px] ${
                        v.rank === "vip" ? "bg-[#f3e8fd] text-[#7c3aed]" : "bg-[#fef3c7] text-[#d97706]"
                      }`}>
                        {RANK_LABELS[v.rank]}
                      </span>
                    )}
                    <span className="text-[12px] text-[#8e9baa]">
                      {formatTimeOnly(v.checkInAt)} 入店
                    </span>
                  </div>
                  <button
                    onClick={() => handleAssign(v.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-[#ffffff] bg-[#3a8f7c] hover:bg-[#2f7a69] rounded-[6px] transition-colors"
                  >
                    <MapPin className="w-3 h-3" />
                    配置
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right side - Action Panel */}
      <div className="w-[280px] flex-shrink-0 space-y-4">
        {/* Check-in section */}
        <div className="bg-[#ffffff] border border-[#d8d3cc] rounded-[8px] p-4">
          <h3 className="text-[14px] font-semibold text-[#2c3e50] mb-3 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#3a8f7c]" />
            入店登録
          </h3>

          {!showNewForm ? (
            <div className="space-y-3">
              <div className="relative">
                <select
                  value={selectedPreset}
                  onChange={(e) => setSelectedPreset(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-[#ffffff] border border-[#d8d3cc] rounded-[6px] appearance-none text-[#2c3e50] focus:outline-none focus:border-[#3a8f7c] focus:ring-1 focus:ring-[#3a8f7c]"
                >
                  <option value="">顧客を選択...</option>
                  {PRESET_CUSTOMERS.filter((c) => !visitors.find((v) => v.name === c.name)).map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({RANK_LABELS[c.rank]})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8e9baa] pointer-events-none" />
              </div>
              <button
                onClick={() => setShowNewForm(true)}
                className="w-full text-left px-3 py-2 text-[12px] text-[#3a8f7c] hover:bg-[#e8f5f0] rounded-[6px] transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                新規顧客
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="顧客名"
                className="w-full px-3 py-2 text-[13px] border border-[#d8d3cc] rounded-[6px] text-[#2c3e50] focus:outline-none focus:border-[#3a8f7c] focus:ring-1 focus:ring-[#3a8f7c]"
              />
              <div className="relative">
                <select
                  value={newRank}
                  onChange={(e) => setNewRank(e.target.value as Rank)}
                  className="w-full px-3 py-2 text-[13px] bg-[#ffffff] border border-[#d8d3cc] rounded-[6px] appearance-none text-[#2c3e50] focus:outline-none focus:border-[#3a8f7c] focus:ring-1 focus:ring-[#3a8f7c]"
                >
                  <option value="regular">レギュラー</option>
                  <option value="silver">シルバー</option>
                  <option value="gold">ゴールド</option>
                  <option value="vip">VIP</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8e9baa] pointer-events-none" />
              </div>
              <button
                onClick={() => {
                  setShowNewForm(false);
                  setNewName("");
                  setNewRank("regular");
                }}
                className="text-[12px] text-[#5a6977] hover:text-[#2c3e50]"
              >
                キャンセル
              </button>
            </div>
          )}

          <button
            onClick={handleCheckIn}
            className="w-full mt-3 px-3 py-2.5 text-[13px] font-medium text-[#ffffff] bg-[#3a8f7c] hover:bg-[#2f7a69] rounded-[6px] transition-colors flex items-center justify-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            入店する
          </button>
        </div>

        {/* Recent entries */}
        <div className="bg-[#ffffff] border border-[#d8d3cc] rounded-[8px] p-4">
          <h3 className="text-[13px] font-semibold text-[#2c3e50] mb-3">最近の入店</h3>
          <div className="space-y-2">
            {recentEntries.map((e, i) => (
              <div key={i} className="flex items-center justify-between text-[12px]">
                <span className="text-[#2c3e50]">{e.name}</span>
                <span className="text-[#8e9baa]">{e.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
