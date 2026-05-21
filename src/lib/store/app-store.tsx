"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

// ===== 型 =====
export type Rank = "regular" | "silver" | "gold" | "vip";
export type VisitorStatus = "active" | "settled" | "unpaid" | "unassigned";
export type TimelineType = "入店" | "退店" | "出勤" | "退勤" | "注文" | "精算" | "チップ" | "イベント";

export interface Visitor {
  id: string; name: string; realName?: string; rank: Rank; status: VisitorStatus;
  table: string; amount: number; time: string;
}
export interface StaffMember {
  id: string; name: string; role: string; status: "working" | "on_break" | "finished" | "off";
  clockIn: string | null;
}
export interface TimelineEvent {
  id: string; time: string; type: TimelineType; name: string;
  realName?: string; detail?: string; amount?: number; rank?: string;
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

// ===== 初期データ(出荷状態のため空) =====
const INIT_TABLES: TableInfo[] = [];
const INIT_VISITORS: Visitor[] = [];
const INIT_STAFF: StaffMember[] = [];
const INIT_TIMELINE: TimelineEvent[] = [];
const INIT_EVENTS: EventItem[] = [];

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
    sales: totalSpent,
    avgSpend: activeVisitors.length > 0 ? Math.round(totalSpent / activeVisitors.length) : 0,
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
