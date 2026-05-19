// 注文・店員呼び出し 共通型

export type TableType = "A" | "B" | "baccarat" | "bj";
export type OrderKind = "drink" | "food" | "call";
export type OrderStatus = "new" | "preparing" | "served" | "done" | "canceled";
export type MenuCategory = "regular" | "tabehoudai" | "premium" | "food";

export interface OrderItem {
  productId: string;
  name: string;
  category: MenuCategory;
  qty: number;
  options: Record<string, string | boolean>;
  note?: string;
}

export type CallReasonType = "order" | "checkout" | "chip" | "trouble" | "other";
export interface CallReason {
  type: CallReasonType;
  text?: string;
}

export interface Seat {
  tableType: TableType;
  tableNo: string;   // "A-1" など
  seatNo: number;    // 1〜10
}

export interface Order {
  id: string;
  createdAt: string;
  updatedAt: string;
  seat: Seat;
  kind: OrderKind;
  status: OrderStatus;
  items?: OrderItem[];
  call?: CallReason;
  customer: {
    lineUserId: string;
    displayName: string;
  };
  preparingAt?: string;
  servedAt?: string;
  doneAt?: string;
  canceledAt?: string;
}

export const TABLE_TYPE_LABEL: Record<TableType, string> = {
  A: "A卓",
  B: "B卓",
  baccarat: "バカラ卓",
  bj: "BJ卓",
};

export const KIND_LABEL: Record<OrderKind, string> = {
  drink: "ドリンク",
  food: "フード",
  call: "呼び出し",
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "新規注文",
  preparing: "準備中",
  served: "提供済",
  done: "完了",
  canceled: "キャンセル",
};

export const CALL_REASON_LABEL: Record<CallReasonType, string> = {
  order: "注文したい",
  checkout: "会計したい",
  chip: "チップ交換",
  trouble: "トラブル対応",
  other: "その他",
};

// 卓番号定義
export const TABLES_BY_TYPE: Record<TableType, string[]> = {
  A: ["A-1", "A-2", "A-3", "A-4", "A-5"],
  B: ["B-1", "B-2", "B-3"],
  baccarat: ["BAC-1", "BAC-2"],
  bj: ["BJ-1", "BJ-2"],
};
