"use client";

import { createPersistedStore } from "@/lib/persist/store";

// =================================================================
// v2 売上注文 (cash register order)
// =================================================================
export interface SalesOrderItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  category: string;
}
export interface SalesOrder {
  id: string;
  customerId?: string;     // 既存顧客に紐付ける場合
  customer: string;        // 表示名
  table?: string;
  items: SalesOrderItem[];
  total: number;
  status: "active" | "settled" | "canceled";
  createdAt: string;       // ISO
  settledAt?: string;
  paymentMethod?: "cash" | "card" | "qr";
  note?: string;
}
export const salesOrderStore = createPersistedStore<SalesOrder[]>("v2_sales_orders_v1", []);

// =================================================================
// 在庫移動履歴
// =================================================================
export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  delta: number;        // +入荷 / -出庫
  reason: "purchase" | "sold" | "adjust" | "waste";
  reasonNote?: string;
  balanceAfter: number;
  createdAt: string;
  performedBy?: string;
}
export const stockMovementStore = createPersistedStore<StockMovement[]>("v2_stock_movements_v1", []);

// =================================================================
// 来店履歴 (visit log)
// =================================================================
export interface VisitLog {
  id: string;
  customerId: string | null;
  customerName: string;
  rank: string;
  checkedInAt: string;
  checkedOutAt?: string;
  table?: string;
  spent?: number;       // 退店時の利用額
}
export const visitLogStore = createPersistedStore<VisitLog[]>("v2_visit_logs_v1", []);

// =================================================================
// チップフロー (型のみ。実データ記録は注文側で連動)
// =================================================================
export interface ChipFlowEntry {
  id: string;
  date: string;       // YYYY-MM-DD
  category: "purchase_cash" | "purchase_multike" | "purchase_point" | "prize" | "tournament" | "bj" | "baccarat" | "ring";
  direction: "out" | "in";
  amount: number;
  customer?: string;
  table?: string;
  staff?: string;
}
export const chipFlowStore = createPersistedStore<ChipFlowEntry[]>("v2_chip_flow_v1", []);
