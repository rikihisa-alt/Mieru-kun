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
  paymentMethod?: "cash" | "card" | "qr" | "credit"; // credit = 後払い(未払い)
  note?: string;
  // ---- 後払い(売掛)関連。paymentMethod === "credit" のときに使用 ----
  unpaid?: boolean;         // true の間は未払い。消し込みで false に
  paidAt?: string;          // 消し込み(支払完了)日時 ISO
  paidMethod?: "cash" | "card" | "qr"; // 消し込み時の実際の支払方法
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
/** ゲーム種別 (卓種別に対応。tables/page.tsx の TableDef["type"] と同じ表記) */
export type ChipGameType = "トナメ" | "リング" | "サイド" | "BJ" | "バカラ";
/** 増減方向: out=貸出(店→客), in=回収(客→店), adjust=調整(在庫合わせ等) */
export type ChipFlowDirection = "out" | "in" | "adjust";
export interface ChipFlowEntry {
  id: string;
  date: string;       // YYYY-MM-DD
  category: "purchase_cash" | "purchase_multike" | "purchase_point" | "prize" | "tournament" | "bj" | "baccarat" | "ring";
  direction: "out" | "in";
  amount: number;
  customer?: string;
  table?: string;
  staff?: string;
  // ---- 以下、チップフロー画面(オーナー確定仕様)で追加使用するフィールド ----
  /** 記録の作成日時 ISO (day/week/month/year 集計や履歴の並び替えに使用) */
  createdAt?: string;
  /** ゲーム種別ごとの増減集計に使用 */
  gameType?: ChipGameType;
  /** 貸出/回収/調整。direction (out/in) はこのフィールドとも一致させて登録する */
  flowDirection?: ChipFlowDirection;
  /** 紐付けた顧客の customerStore.id (顧客残高を連動更新する場合に使用) */
  customerId?: string;
  /** 調整も含めた符号付き枚数 (顧客保有ベース: 貸出=+, 回収/調整減=-) */
  signedAmount?: number;
  /** メモ */
  note?: string;
}
export const chipFlowStore = createPersistedStore<ChipFlowEntry[]>("v2_chip_flow_v1", []);
