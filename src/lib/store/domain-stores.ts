"use client";

import { createPersistedStore } from "@/lib/persist/store";
import type { StaffFull } from "@/lib/staff-data";

// ===== 顧客 =====
export type CustomerRank = "regular" | "silver" | "gold" | "vip";
export interface CustomerRecord {
  id: string;
  name: string;
  nickname: string;
  rank: CustomerRank;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  lineId?: string;
  referrerName?: string;
  notes?: string;
  cautionText?: string;
  isBlacklisted?: boolean;
  isHidden?: boolean;
  snsX?: string;
  snsIg?: string;
  snsTikTok?: string;
  totalVisits: number;
  totalSpent: number;
  chipBalance: number;
  pointBalance: number;
  lastVisit?: string;
  prizeCount: number;
  lastPrize?: string;
  createdAt: string;
}

// ===== 従業員 =====
export type StaffRecord = StaffFull;

// ===== 商品マスタ =====
export type ProductCategory = "entrance" | "drink" | "food" | "tournament_fee" | "tip_purchase" | "tip_use" | "discount" | "adjustment" | "other";
export interface ProductRecord {
  id: string;
  name: string;
  price: number;
  category: ProductCategory;
  active: boolean;
  createdAt: string;
}

// ===== イベント =====
export interface EventRecord {
  id: string;
  title: string;
  category: "tournament" | "party" | "campaign";
  date: string;
  time: string;
  capacity: number;
  reservedCount: number;
  fee?: number;
  note?: string;
  status: "draft" | "open" | "closed";
  createdAt: string;
}

// ===== POP =====
export interface PopRecord {
  id: string;
  title: string;
  body: string;
  eventTag?: string;
  publishedAt?: string;
  active: boolean;
  createdAt: string;
}

// ===== ポイントルール =====
export interface PointRuleRecord {
  id: string;
  name: string;
  points: number;
  conditionText: string;
  isActive: boolean;
  priority: number;
  startsAt?: string;
  endsAt?: string;
  description?: string;
}

// ===== 予約 =====
export type ReservationStatus = "pending" | "confirmed" | "canceled" | "no_show" | "arrived";
export interface ReservationRecord {
  id: string;
  customerName: string;
  nickname?: string;
  date: string;
  time: string;
  party: number;
  note?: string;
  status: ReservationStatus;
  source: "phone" | "line" | "walk_in" | "other";
  createdAt: string;
}

// ===== 店舗設定 =====
export interface RankDef { id: string; name: string; label: string; minVisits: number; color: string; }
export interface ChipPrice { amount: number; price: number; }
export interface ChipSetting { unit: string; symbol: string; label: string; prices: ChipPrice[]; }
export interface PointReward { id: string; trigger: string; amount: number; }
export interface EntrancePlan { id: string; label: string; price: number; note?: string; }
export interface StoreSettings {
  storeName: string;
  displayName: string;
  address: string;
  phone: string;
  openTime: string;
  closeTime: string;
  closedDays: string[];
  ranks: RankDef[];
  rankLabel: string;
  chip: ChipSetting;
  pointUnit: string;
  pointLabel: string;
  pointRewards: PointReward[];
  entranceEnabled: boolean;
  entranceRequired: boolean;
  entranceSettlementMode: "prepay" | "on_settlement";
  entrancePlans: EntrancePlan[];
}

// =================================================================
// ストア定義
// =================================================================
export const customerStore = createPersistedStore<CustomerRecord[]>("tempo_customers_v1", [
  { id: "a8f3d9c2", name: "田中 太郎", nickname: "タロウ", rank: "gold", phone: "090-1234-5678", totalVisits: 25, totalSpent: 150000, chipBalance: 5000, pointBalance: 1200, lastVisit: "2026/04/10", prizeCount: 3, lastPrize: "2026/04/14", createdAt: "2025-01-10" },
  { id: "b4c9d2f1", name: "鈴木 花子", nickname: "ハナ", rank: "vip", phone: "090-2345-6789", totalVisits: 50, totalSpent: 350000, chipBalance: 12000, pointBalance: 3500, lastVisit: "2026/04/12", prizeCount: 6, lastPrize: "2026/04/14", createdAt: "2024-08-15" },
  { id: "c2e5a9f3", name: "佐藤 健一", nickname: "ケン", rank: "silver", phone: "090-3456-7890", totalVisits: 10, totalSpent: 45000, chipBalance: 2000, pointBalance: 400, lastVisit: "2026/04/08", prizeCount: 1, lastPrize: "2026/03/02", createdAt: "2025-11-01" },
  { id: "d1b7f4c8", name: "高橋 美咲", nickname: "ミィ", rank: "regular", phone: "", totalVisits: 3, totalSpent: 12000, chipBalance: 500, pointBalance: 100, lastVisit: "2026/04/05", prizeCount: 0, createdAt: "2026-03-01" },
  { id: "e9a3b2d5", name: "伊藤 大輔", nickname: "ダイ", rank: "regular", phone: "090-4567-8901", totalVisits: 1, totalSpent: 3000, chipBalance: 0, pointBalance: 50, lastVisit: "2026/04/01", prizeCount: 0, createdAt: "2026-03-15" },
  { id: "f8d2e4a7", name: "渡辺 優子", nickname: "ユウ", rank: "gold", phone: "090-5678-9012", totalVisits: 30, totalSpent: 200000, chipBalance: 8000, pointBalance: 2000, lastVisit: "2026/04/11", prizeCount: 4, lastPrize: "2026/04/13", createdAt: "2024-10-22" },
  { id: "7c3f9a2d", name: "山本 翔太", nickname: "ショウ", rank: "silver", phone: "", totalVisits: 8, totalSpent: 32000, chipBalance: 1500, pointBalance: 300, lastVisit: "2026/03/28", prizeCount: 1, lastPrize: "2026/02/20", createdAt: "2025-09-12" },
  { id: "8b5d4e7f", name: "中村 あゆみ", nickname: "アユ", rank: "regular", phone: "090-6789-0123", totalVisits: 2, totalSpent: 8000, chipBalance: 200, pointBalance: 80, lastVisit: "2026/03/20", prizeCount: 0, createdAt: "2026-02-01" },
]);

export const staffStore = createPersistedStore<StaffRecord[]>("tempo_staff_v1", []);

export const productStore = createPersistedStore<ProductRecord[]>("tempo_products_v1", [
  { id: "p1", name: "エントランス", price: 1000, category: "entrance", active: true, createdAt: "2025-01-01" },
  { id: "p2", name: "トナメ参加費", price: 3000, category: "tournament_fee", active: true, createdAt: "2025-01-01" },
  { id: "p3", name: "ビール", price: 600, category: "drink", active: true, createdAt: "2025-01-01" },
  { id: "p4", name: "ハイボール", price: 500, category: "drink", active: true, createdAt: "2025-01-01" },
  { id: "p5", name: "ソフトドリンク", price: 300, category: "drink", active: true, createdAt: "2025-01-01" },
  { id: "p6", name: "ウイスキー", price: 800, category: "drink", active: true, createdAt: "2025-01-01" },
  { id: "p7", name: "カクテル", price: 700, category: "drink", active: true, createdAt: "2025-01-01" },
  { id: "p8", name: "ポテトフライ", price: 400, category: "food", active: true, createdAt: "2025-01-01" },
  { id: "p9", name: "枝豆", price: 300, category: "food", active: true, createdAt: "2025-01-01" },
  { id: "p10", name: "ピザ", price: 800, category: "food", active: true, createdAt: "2025-01-01" },
  { id: "p11", name: "チップ 1000枚", price: 1000, category: "tip_purchase", active: true, createdAt: "2025-01-01" },
  { id: "p12", name: "チップ 5000枚", price: 5000, category: "tip_purchase", active: true, createdAt: "2025-01-01" },
  { id: "p13", name: "会員割引", price: -500, category: "discount", active: true, createdAt: "2025-01-01" },
]);

export const eventStore = createPersistedStore<EventRecord[]>("tempo_events_v1", [
  { id: "e1", title: "春のVIPナイト", category: "party", date: "2026-04-25", time: "20:00-02:00", capacity: 30, reservedCount: 18, fee: 3000, note: "ウェルカムドリンク付き", status: "open", createdAt: "2026-04-01" },
  { id: "e2", title: "ウィークエンドトーナメント", category: "tournament", date: "2026-04-27", time: "19:00-23:00", capacity: 40, reservedCount: 25, fee: 5000, status: "open", createdAt: "2026-04-05" },
  { id: "e3", title: "新作カクテル試飲会", category: "campaign", date: "2026-05-02", time: "22:00-23:00", capacity: 10, reservedCount: 3, status: "open", createdAt: "2026-04-10" },
]);

export const popStore = createPersistedStore<PopRecord[]>("tempo_pops_v1", []);

export const pointRuleStore = createPersistedStore<PointRuleRecord[]>("tempo_point_rules_v1", [
  { id: "pr1", name: "通常来店", points: 100, conditionText: "来店時", isActive: true, priority: 100 },
  { id: "pr2", name: "高額利用ボーナス", points: 500, conditionText: "¥10,000利用", isActive: true, priority: 90 },
  { id: "pr3", name: "イベント参加", points: 200, conditionText: "イベント参加", isActive: true, priority: 80 },
]);

export const reservationStore = createPersistedStore<ReservationRecord[]>("tempo_reservations_v1", []);

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Come On Casino",
  displayName: "カモンカジノ",
  address: "",
  phone: "",
  openTime: "18:00",
  closeTime: "05:00",
  closedDays: ["月"],
  ranks: [
    { id: "r1", name: "regular", label: "レギュラー", minVisits: 0, color: "#9aa0a6" },
    { id: "r2", name: "silver", label: "シルバー", minVisits: 5, color: "#6b7280" },
    { id: "r3", name: "gold", label: "ゴールド", minVisits: 15, color: "#d97706" },
    { id: "r4", name: "vip", label: "VIP", minVisits: 30, color: "#7c3aed" },
  ],
  rankLabel: "ランク",
  chip: {
    unit: "枚", symbol: "🎰", label: "チップ",
    prices: [{ amount: 1000, price: 1000 }, { amount: 5000, price: 5000 }, { amount: 10000, price: 10000 }],
  },
  pointUnit: "pt",
  pointLabel: "ポイント",
  pointRewards: [
    { id: "pr1", trigger: "来店", amount: 100 },
    { id: "pr2", trigger: "¥10,000利用", amount: 500 },
    { id: "pr3", trigger: "イベント参加", amount: 200 },
  ],
  entranceEnabled: true,
  entranceRequired: true,
  entranceSettlementMode: "prepay",
  entrancePlans: [
    { id: "ep1", label: "通常", price: 1500, note: "すべての来店客" },
    { id: "ep2", label: "会員(SILVER以上)", price: 1000 },
    { id: "ep3", label: "VIP", price: 0, note: "無料" },
  ],
};

export const settingsStore = createPersistedStore<StoreSettings>("tempo_settings_v1", DEFAULT_SETTINGS);
