"use client";

import { useState } from "react";
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
} from "lucide-react";

interface TableInfo {
  name: string;
  occupied: number;
  max: number;
  type: "vip" | "regular" | "semi-vip";
}

interface RecentEntry {
  name: string;
  time: string;
  rank: "regular" | "silver" | "gold" | "vip";
}

interface EventItem {
  title: string;
  time: string;
  status: "準備中" | "進行中" | "完了";
  participants: number;
}

const RANK_DOT_COLORS: Record<string, string> = {
  regular: "#9aa0a6",
  silver: "#5f6368",
  gold: "#f59e0b",
  vip: "#7c3aed",
};

export default function DashboardPage() {
  const [kpis] = useState({
    visitors: 23,
    unpaid: 2,
    activeTables: 6,
    onDuty: 8,
    todayEvents: 2,
    sales: 185000,
    avgSpend: 8043,
    orders: 47,
    targetSales: 250000,
  });

  const [tables] = useState<TableInfo[]>([
    { name: "VIP-1", occupied: 4, max: 6, type: "vip" },
    { name: "VIP-2", occupied: 6, max: 6, type: "vip" },
    { name: "A-1", occupied: 3, max: 4, type: "regular" },
    { name: "A-2", occupied: 0, max: 4, type: "regular" },
    { name: "A-3", occupied: 2, max: 4, type: "regular" },
    { name: "B-1", occupied: 4, max: 4, type: "regular" },
    { name: "B-2", occupied: 0, max: 4, type: "regular" },
    { name: "S-1", occupied: 3, max: 4, type: "semi-vip" },
  ]);

  const [recentEntries] = useState<RecentEntry[]>([
    { name: "田中 太郎", time: "21:30", rank: "gold" },
    { name: "佐藤 花子", time: "21:15", rank: "vip" },
    { name: "鈴木 一郎", time: "20:45", rank: "regular" },
    { name: "高橋 美咲", time: "20:30", rank: "silver" },
    { name: "渡辺 健太", time: "20:10", rank: "regular" },
  ]);

  const [events] = useState<EventItem[]>([
    { title: "VIPナイト", time: "20:00 - 24:00", status: "進行中", participants: 12 },
    { title: "新作カクテル試飲会", time: "22:00 - 23:00", status: "準備中", participants: 8 },
  ]);

  const progressPercent = Math.min(100, Math.round((kpis.sales / kpis.targetSales) * 100));

  function tableStatusColor(occupied: number, max: number): string {
    if (occupied === 0) return "#9aa0a6";
    if (occupied >= max) return "#c5221f";
    if (occupied >= max * 0.75) return "#f59e0b";
    return "#1e7e34";
  }

  function typeBadge(type: string) {
    switch (type) {
      case "vip":
        return "bg-[#f3e8fd] text-[#7c3aed]";
      case "semi-vip":
        return "bg-[#fef3c7] text-[#d97706]";
      default:
        return "bg-[#f5f6f8] text-[#5f6368]";
    }
  }

  function typeLabel(type: string) {
    switch (type) {
      case "vip":
        return "VIP";
      case "semi-vip":
        return "セミVIP";
      default:
        return "一般";
    }
  }

  function eventStatusBadge(status: string) {
    switch (status) {
      case "進行中":
        return "bg-[#e6f4ea] text-[#1e7e34]";
      case "準備中":
        return "bg-[#fef3c7] text-[#d97706]";
      case "完了":
        return "bg-[#e8f0fe] text-[#1a73e8]";
      default:
        return "bg-[#f5f6f8] text-[#5f6368]";
    }
  }

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Row 1: KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-[#ffffff] border border-[#dadce0] rounded-[8px] px-4 py-3.5">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-[14px] h-[14px] text-[#9aa0a6]" />
            <span className="text-[11px] text-[#9aa0a6] font-medium">来店数</span>
          </div>
          <p className="text-[20px] font-bold text-[#1a1a1a] tracking-tight">{kpis.visitors}名</p>
        </div>
        <div className="bg-[#ffffff] border border-[#dadce0] rounded-[8px] px-4 py-3.5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-[14px] h-[14px] text-[#c5221f]" />
            <span className="text-[11px] text-[#9aa0a6] font-medium">未払</span>
          </div>
          <p className={`text-[20px] font-bold tracking-tight ${kpis.unpaid > 0 ? "text-[#c5221f]" : "text-[#1a1a1a]"}`}>
            {kpis.unpaid}件
          </p>
        </div>
        <div className="bg-[#ffffff] border border-[#dadce0] rounded-[8px] px-4 py-3.5">
          <div className="flex items-center gap-2 mb-1">
            <LayoutGrid className="w-[14px] h-[14px] text-[#9aa0a6]" />
            <span className="text-[11px] text-[#9aa0a6] font-medium">稼働卓</span>
          </div>
          <p className="text-[20px] font-bold text-[#1a1a1a] tracking-tight">{kpis.activeTables}/{tables.length}卓</p>
        </div>
        <div className="bg-[#ffffff] border border-[#dadce0] rounded-[8px] px-4 py-3.5">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-[14px] h-[14px] text-[#9aa0a6]" />
            <span className="text-[11px] text-[#9aa0a6] font-medium">出勤</span>
          </div>
          <p className="text-[20px] font-bold text-[#1a1a1a] tracking-tight">{kpis.onDuty}名</p>
        </div>
        <div className="bg-[#ffffff] border border-[#dadce0] rounded-[8px] px-4 py-3.5">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="w-[14px] h-[14px] text-[#9aa0a6]" />
            <span className="text-[11px] text-[#9aa0a6] font-medium">本日イベント</span>
          </div>
          <p className="text-[20px] font-bold text-[#1a1a1a] tracking-tight">{kpis.todayEvents}件</p>
        </div>
      </div>

      {/* Row 2: Alert */}
      {kpis.unpaid > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-[#fce8e6] border border-[#c5221f]/20 rounded-[8px] text-[13px]">
          <AlertTriangle className="w-4 h-4 text-[#c5221f] flex-shrink-0" />
          <span className="text-[#c5221f] font-medium">未精算 {kpis.unpaid}件</span>
          <span className="text-[#5f6368]">-- 精算処理が必要です</span>
        </div>
      )}

      {/* Row 3: Business status + Table status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Business status */}
        <div className="bg-[#ffffff] border border-[#dadce0] rounded-[8px] p-4">
          <h2 className="text-[14px] font-semibold text-[#1a1a1a] mb-4">営業状況</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#5f6368] flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-[#9aa0a6]" />
                売上
              </span>
              <span className="font-bold text-[#1a1a1a]">¥{kpis.sales.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#5f6368] flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#9aa0a6]" />
                来店
              </span>
              <span className="font-medium text-[#1a1a1a]">{kpis.visitors}名</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#5f6368] flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-[#9aa0a6]" />
                客単価
              </span>
              <span className="font-medium text-[#1a1a1a]">¥{kpis.avgSpend.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#5f6368] flex items-center gap-2">
                <ShoppingBag className="w-3.5 h-3.5 text-[#9aa0a6]" />
                注文
              </span>
              <span className="font-medium text-[#1a1a1a]">{kpis.orders}件</span>
            </div>

            {/* Progress bar */}
            <div className="pt-2 mt-2 border-t border-[#f0f0f0]">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-[#9aa0a6]">目標達成率</span>
                <span className="font-medium text-[#1a1a1a]">{progressPercent}%</span>
              </div>
              <div className="w-full h-[6px] bg-[#f5f6f8] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: progressPercent >= 100 ? "#1e7e34" : progressPercent >= 60 ? "#1a73e8" : "#f59e0b",
                  }}
                />
              </div>
              <div className="text-[11px] text-[#9aa0a6] mt-1">
                ¥{kpis.sales.toLocaleString()} / ¥{kpis.targetSales.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Table status */}
        <div className="bg-[#ffffff] border border-[#dadce0] rounded-[8px] p-4">
          <h2 className="text-[14px] font-semibold text-[#1a1a1a] mb-4">卓稼働</h2>
          <div className="space-y-2">
            {tables.map((t) => (
              <div key={t.name} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-[8px] h-[8px] rounded-full"
                    style={{ backgroundColor: tableStatusColor(t.occupied, t.max) }}
                  />
                  <span className="text-[13px] font-medium text-[#1a1a1a]">{t.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[#5f6368]">
                    {t.occupied}/{t.max}名
                  </span>
                  <span className={`inline px-1.5 py-0.5 text-[10px] font-medium rounded-[4px] ${typeBadge(t.type)}`}>
                    {typeLabel(t.type)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Recent entries + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Recent entries */}
        <div className="bg-[#ffffff] border border-[#dadce0] rounded-[8px] p-4">
          <h2 className="text-[14px] font-semibold text-[#1a1a1a] mb-3">最近の入店</h2>
          <div className="space-y-2">
            {recentEntries.map((e, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <span className="text-[12px] text-[#9aa0a6] w-[40px] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {e.time}
                </span>
                <span
                  className="inline-block w-[8px] h-[8px] rounded-full flex-shrink-0"
                  style={{ backgroundColor: RANK_DOT_COLORS[e.rank] }}
                />
                <span className="text-[13px] text-[#1a1a1a]">{e.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Events */}
        <div className="bg-[#ffffff] border border-[#dadce0] rounded-[8px] p-4">
          <h2 className="text-[14px] font-semibold text-[#1a1a1a] mb-3">本日のイベント</h2>
          <div className="space-y-3">
            {events.map((ev, i) => (
              <div key={i} className="p-3 border border-[#dadce0] rounded-[6px]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-medium text-[#1a1a1a]">{ev.title}</span>
                  <span className={`inline px-2 py-0.5 text-[11px] font-medium rounded-[4px] ${eventStatusBadge(ev.status)}`}>
                    {ev.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[12px] text-[#5f6368]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#9aa0a6]" />
                    {ev.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-[#9aa0a6]" />
                    {ev.participants}名
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
