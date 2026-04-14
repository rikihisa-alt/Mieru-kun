"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

// ===== 型 =====
export type Rank = "regular" | "silver" | "gold" | "vip";
export type VisitorStatus = "active" | "settled" | "unpaid" | "unassigned";
export type TimelineType = "入店" | "退店" | "出勤" | "退勤" | "注文" | "精算" | "チップ" | "イベント";

export interface Visitor {
  id: string; name: string; rank: Rank; status: VisitorStatus;
  table: string; amount: number; time: string;
}
export interface StaffMember {
  id: string; name: string; role: string; status: "working" | "on_break" | "finished" | "off";
  clockIn: string | null;
}
export interface TimelineEvent {
  id: string; time: string; type: TimelineType; name: string;
  detail?: string; amount?: number; rank?: string;
}
export interface EventItem {
  id: string; title: string; time: string; status: "進行中" | "準備中" | "完了";
  participants: number;
}
export interface TableInfo {
  name: string; occupied: number; max: number; type: string;
}
export interface OrderItem { name: string; price: number; qty: number; }
export interface VisitOrder {
  id: string; customer: string; rank: string; table: string;
  items: OrderItem[]; total: number; status: "active" | "settled";
}

// ===== 初期データ（卓管理の4卓と整合） =====

// 卓: テーブル1(トナメ9席), テーブル2(トナメ9席), テーブル3(リング10席), テーブル4(サイド6席)
const INIT_TABLES: TableInfo[] = [
  { name: "テーブル1", occupied: 3, max: 9, type: "トナメ" },
  { name: "テーブル2", occupied: 1, max: 9, type: "トナメ" },
  { name: "テーブル3", occupied: 2, max: 10, type: "リング" },
  { name: "テーブル4", occupied: 0, max: 6, type: "サイド" },
];

// 来店中の顧客（卓管理のプレイヤーと一致）
const INIT_VISITORS: Visitor[] = [
  { id: "v1", name: "田中 太郎", rank: "gold", status: "active", table: "テーブル1", amount: 1500, time: "18:30" },
  { id: "v2", name: "鈴木 花子", rank: "vip", status: "active", table: "テーブル1", amount: 800, time: "19:15" },
  { id: "v3", name: "佐藤 健一", rank: "silver", status: "active", table: "テーブル1", amount: 0, time: "20:00" },
  { id: "v4", name: "高橋 美咲", rank: "regular", status: "active", table: "テーブル3", amount: 300, time: "20:10" },
  { id: "v5", name: "伊藤 大輔", rank: "regular", status: "active", table: "テーブル3", amount: 0, time: "20:20" },
  { id: "v6", name: "中村 あゆみ", rank: "regular", status: "active", table: "テーブル2", amount: 0, time: "20:30" },
  { id: "v7", name: "渡辺 優子", rank: "gold", status: "unassigned", table: "", amount: 0, time: "20:45" },
  { id: "v8", name: "山本 翔太", rank: "silver", status: "unassigned", table: "", amount: 0, time: "21:00" },
];

// スタッフ
const INIT_STAFF: StaffMember[] = [
  { id: "s1", name: "山田 太郎", role: "ディーラー", status: "working", clockIn: "18:00" },
  { id: "s2", name: "鈴木 一郎", role: "ディーラー", status: "working", clockIn: "18:00" },
  { id: "s3", name: "佐藤 花", role: "フロア", status: "finished", clockIn: "17:30" },
  { id: "s4", name: "高橋 健", role: "ディーラー", status: "working", clockIn: "18:15" },
  { id: "s5", name: "伊藤 美咲", role: "フロア", status: "off", clockIn: null },
];

// タイムライン
const INIT_TIMELINE: TimelineEvent[] = [
  { id: "tl1", time: "21:00", type: "入店", name: "山本 翔太", rank: "silver" },
  { id: "tl2", time: "20:45", type: "入店", name: "渡辺 優子", rank: "gold" },
  { id: "tl3", time: "20:30", type: "入店", name: "中村 あゆみ", rank: "regular" },
  { id: "tl4", time: "20:20", type: "入店", name: "伊藤 大輔", rank: "regular" },
  { id: "tl5", time: "20:10", type: "入店", name: "高橋 美咲", rank: "regular" },
  { id: "tl6", time: "20:00", type: "イベント", name: "VIPナイト", detail: "開始" },
  { id: "tl7", time: "20:00", type: "入店", name: "佐藤 健一", rank: "silver" },
  { id: "tl8", time: "19:15", type: "注文", name: "鈴木 花子", detail: "ウイスキー ×1", amount: 800, rank: "vip" },
  { id: "tl9", time: "19:15", type: "入店", name: "鈴木 花子", rank: "vip" },
  { id: "tl10", time: "18:30", type: "注文", name: "田中 太郎", detail: "ビール ×2, 枝豆 ×1", amount: 1500, rank: "gold" },
  { id: "tl11", time: "18:30", type: "入店", name: "田中 太郎", rank: "gold" },
  { id: "tl12", time: "18:15", type: "出勤", name: "高橋 健", detail: "ディーラー" },
  { id: "tl13", time: "18:00", type: "出勤", name: "山田 太郎", detail: "ディーラー" },
  { id: "tl14", time: "18:00", type: "出勤", name: "鈴木 一郎", detail: "ディーラー" },
  { id: "tl15", time: "17:30", type: "出勤", name: "佐藤 花", detail: "フロア" },
];

const INIT_EVENTS: EventItem[] = [
  { id: "e1", title: "VIPナイト", time: "20:00-24:00", status: "進行中", participants: 8 },
  { id: "e2", title: "新作カクテル試飲会", time: "22:00-23:00", status: "準備中", participants: 0 },
];

// ===== KPI =====
export interface KPIs {
  visitors: number; unpaid: number; activeTables: number; totalTables: number;
  onDuty: number; sales: number; avgSpend: number; orders: number; targetSales: number;
}

// ===== Context =====
interface AppStore {
  visitors: Visitor[];
  staffMembers: StaffMember[];
  timeline: TimelineEvent[];
  events: EventItem[];
  tables: TableInfo[];
  kpis: KPIs;
  addVisitor: (name: string, rank: Rank) => void;
  settleVisitor: (id: string) => void;
  assignTable: (id: string, table: string) => void;
  addTimelineEvent: (ev: Omit<TimelineEvent, "id">) => void;
  clockInStaff: (id: string) => void;
  clockOutStaff: (id: string) => void;
  updateTables: (tables: TableInfo[]) => void;
}

const AppStoreContext = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [visitors, setVisitors] = useState<Visitor[]>(INIT_VISITORS);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(INIT_STAFF);
  const [timeline, setTimeline] = useState<TimelineEvent[]>(INIT_TIMELINE);
  const [events] = useState<EventItem[]>(INIT_EVENTS);
  const [tables, setTables] = useState<TableInfo[]>(INIT_TABLES);

  const updateTables = useCallback((newTables: TableInfo[]) => {
    setTables(newTables);
  }, []);

  // KPI算出
  const activeVisitors = visitors.filter(v => v.status !== "settled");
  const settledVisitors = visitors.filter(v => v.status === "settled");
  const unpaidCount = visitors.filter(v => v.status === "unpaid").length;
  const totalSpent = visitors.reduce((s, v) => s + v.amount, 0);
  const activeTables = tables.filter(t => t.occupied > 0).length;
  const onDuty = staffMembers.filter(s => s.status === "working" || s.status === "on_break").length;
  const orderEvents = timeline.filter(t => t.type === "注文" || t.type === "精算");

  const kpis: KPIs = {
    visitors: activeVisitors.length,
    unpaid: unpaidCount,
    activeTables,
    totalTables: tables.length,
    onDuty,
    sales: totalSpent > 0 ? totalSpent : 2600,
    avgSpend: activeVisitors.length > 0 ? Math.round((totalSpent > 0 ? totalSpent : 2600) / activeVisitors.length) : 0,
    orders: orderEvents.length,
    targetSales: 250000,
  };

  const now = () => {
    const d = new Date();
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const addVisitor = useCallback((name: string, rank: Rank) => {
    const time = now();
    setVisitors(prev => [{ id: `v${Date.now()}`, name, rank, status: "unassigned", table: "", amount: 0, time }, ...prev]);
    setTimeline(prev => [{ id: `tl${Date.now()}`, time, type: "入店", name, rank }, ...prev]);
  }, []);

  const settleVisitor = useCallback((id: string) => {
    setVisitors(prev => {
      const v = prev.find(x => x.id === id);
      if (v) setTimeline(tl => [{ id: `tl${Date.now()}`, time: now(), type: "精算", name: v.name, amount: v.amount, rank: v.rank }, ...tl]);
      return prev.map(v => v.id === id ? { ...v, status: "settled" as const } : v);
    });
  }, []);

  const assignTable = useCallback((id: string, table: string) => {
    setVisitors(prev => prev.map(v => v.id === id ? { ...v, table, status: "active" as const } : v));
  }, []);

  const addTimelineEvent = useCallback((ev: Omit<TimelineEvent, "id">) => {
    setTimeline(prev => [{ ...ev, id: `tl${Date.now()}` }, ...prev]);
  }, []);

  const clockInStaff = useCallback((id: string) => {
    const time = now();
    setStaffMembers(prev => {
      const s = prev.find(x => x.id === id);
      if (s) setTimeline(tl => [{ id: `tl${Date.now()}`, time, type: "出勤", name: s.name, detail: s.role }, ...tl]);
      return prev.map(s => s.id === id ? { ...s, status: "working" as const, clockIn: time } : s);
    });
  }, []);

  const clockOutStaff = useCallback((id: string) => {
    const time = now();
    setStaffMembers(prev => {
      const s = prev.find(x => x.id === id);
      if (s) setTimeline(tl => [{ id: `tl${Date.now()}`, time, type: "退勤", name: s.name, detail: s.role }, ...tl]);
      return prev.map(s => s.id === id ? { ...s, status: "finished" as const } : s);
    });
  }, []);

  return (
    <AppStoreContext.Provider value={{
      visitors, staffMembers, timeline, events, tables, kpis,
      addVisitor, settleVisitor, assignTable, addTimelineEvent,
      clockInStaff, clockOutStaff, updateTables,
    }}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}
