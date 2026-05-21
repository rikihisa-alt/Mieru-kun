"use client";

import { useEffect, useState } from "react";
import type { Order, OrderStatus } from "./types";

// =================================================================
// 注文ストア (デモ実装: localStorage + BroadcastChannel でクロスタブ同期)
// 本番接続時はこのファイルをSupabase Realtime実装に差し替え可能。
// =================================================================

const STORAGE_KEY = "tempo_orders_v1";
const CHANNEL = "tempo_orders_v1";

type Listener = (orders: Order[]) => void;
type Event =
  | { type: "added"; order: Order }
  | { type: "updated"; order: Order }
  | { type: "sync"; orders: Order[] };
type EventListener = (e: Event) => void;

class OrderStore {
  private orders: Order[] = [];
  private listeners = new Set<Listener>();
  private eventListeners = new Set<EventListener>();
  private channel: BroadcastChannel | null = null;
  private initialized = false;

  init() {
    if (this.initialized || typeof window === "undefined") return;
    this.initialized = true;
    this.load();
    this.seedIfEmpty();
    try {
      this.channel = new BroadcastChannel(CHANNEL);
      this.channel.onmessage = (e) => {
        const ev = e.data as Event;
        if (ev.type === "sync") {
          this.orders = ev.orders;
        } else if (ev.type === "added") {
          if (!this.orders.find(o => o.id === ev.order.id)) {
            this.orders = [ev.order, ...this.orders];
          }
        } else if (ev.type === "updated") {
          this.orders = this.orders.map(o => o.id === ev.order.id ? ev.order : o);
        }
        this.notify();
        this.eventListeners.forEach(l => l(ev));
      };
    } catch {
      // BroadcastChannel未対応(古いブラウザ)はクロスタブ同期なし
    }
    // 他タブからの変更を拾う(BroadcastChannelの保険)
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          this.orders = JSON.parse(e.newValue);
          this.notify();
        } catch { /* */ }
      }
    });
  }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.orders = JSON.parse(raw);
    } catch { /* */ }
  }
  private persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.orders)); } catch { /* */ }
  }
  private notify() {
    const sorted = this.getAll();
    this.listeners.forEach(l => l(sorted));
  }
  private emit(ev: Event) {
    this.persist();
    this.notify();
    this.eventListeners.forEach(l => l(ev));
    try { this.channel?.postMessage(ev); } catch { /* */ }
  }
  private seedIfEmpty() {
    if (this.orders.length > 0) return;
    // 起動時のデモ用に1〜2件
    const now = new Date();
    const t1 = new Date(now.getTime() - 1000 * 60 * 4).toISOString();
    const t2 = new Date(now.getTime() - 1000 * 60 * 10).toISOString();
    this.orders = [
      {
        id: `seed-${Date.now()}-1`,
        createdAt: t1, updatedAt: t1,
        seat: { tableType: "A", tableNo: "A-2", seatNo: 3 },
        kind: "drink",
        status: "new",
        items: [{ productId: "d3", name: "アイスコーヒー", category: "regular", qty: 1, options: { ice: "氷あり", straw: "ストローあり" } }],
        customer: { lineUserId: "U_demo_001", displayName: "田中 太郎" },
      },
      {
        id: `seed-${Date.now()}-2`,
        createdAt: t2, updatedAt: t2,
        seat: { tableType: "baccarat", tableNo: "BAC-1", seatNo: 5 },
        kind: "call",
        status: "new",
        call: { type: "chip" },
        customer: { lineUserId: "U_demo_002", displayName: "鈴木 花子" },
      },
    ];
    this.persist();
  }

  getAll(): Order[] {
    return this.orders.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  subscribe(l: Listener): () => void {
    this.init();
    this.listeners.add(l);
    l(this.getAll());
    return () => { this.listeners.delete(l); };
  }
  onEvent(l: EventListener): () => void {
    this.init();
    this.eventListeners.add(l);
    return () => { this.eventListeners.delete(l); };
  }

  add(order: Order) {
    this.orders = [order, ...this.orders];
    this.emit({ type: "added", order });
  }

  updateStatus(id: string, status: OrderStatus) {
    const now = new Date().toISOString();
    const found = this.orders.find(o => o.id === id);
    if (!found) return;
    const next: Order = {
      ...found, status, updatedAt: now,
      ...(status === "preparing" && { preparingAt: now }),
      ...(status === "served" && { servedAt: now }),
      ...(status === "done" && { doneAt: now }),
      ...(status === "canceled" && { canceledAt: now }),
    };
    this.orders = this.orders.map(o => o.id === id ? next : o);
    this.emit({ type: "updated", order: next });
  }
}

export const orderStore = new OrderStore();

// =================================================================
// React Hooks
// =================================================================
export function useOrders(): Order[] {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    orderStore.init();
    return orderStore.subscribe(setOrders);
  }, []);
  return orders;
}

export function useOrderEvents(handler: (e: { type: "added" | "updated" | "sync"; order?: Order; orders?: Order[] }) => void) {
  useEffect(() => {
    orderStore.init();
    return orderStore.onEvent(handler as Parameters<typeof orderStore.onEvent>[0]);
  }, [handler]);
}
