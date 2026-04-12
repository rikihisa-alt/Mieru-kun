// ============================================================
// てんぽみえるくん - 全テーブル型定義
// ============================================================

// --- Enums ---

export type StaffRole = "admin" | "owner" | "manager" | "staff" | "accounting";
export type CustomerRank = "regular" | "silver" | "gold" | "vip";
export type VisitStatus = "active" | "settled" | "cancelled";
export type OrderStatus = "pending" | "confirmed" | "cancelled";
export type PaymentMethod = "cash" | "card" | "electronic";
export type PaymentStatus = "completed" | "refunded";
export type AttendanceStatus = "working" | "on_break" | "finished";
export type ProductCategory = "drink" | "food" | "chip" | "other";
export type EventStatus = "draft" | "published" | "ended";
export type EventEntryStatus = "reserved" | "attended" | "cancelled";
export type AnnouncementTarget = "all" | "staff" | "customers";

// --- Base ---

export interface Store {
  id: string;
  name: string;
  display_name: string | null;
  address: string | null;
  phone: string | null;
  created_at: string;
}

// --- Staff ---

export interface StaffUser {
  id: string;
  store_id: string;
  name: string;
  role: StaffRole;
  hourly_wage: number | null;
  is_active: boolean;
  created_at: string;
}

// --- Customer ---

export interface Customer {
  id: string;
  store_id: string;
  name: string;
  line_id: string | null;
  phone: string | null;
  email: string | null;
  rank: CustomerRank;
  total_visits: number;
  total_spent: number;
  chip_balance: number;
  point_balance: number;
  notes: string | null;
  last_visit_at: string | null;
  birthday: string | null;
  gender: "male" | "female" | "other" | null;
  created_at: string;
}

// --- Visit ---

export interface Visit {
  id: string;
  store_id: string;
  customer_id: string;
  staff_id: string | null;
  table_number: string | null;
  check_in_at: string;
  check_out_at: string | null;
  status: VisitStatus;
  total_amount: number;
  stay_minutes: number | null;
  created_at: string;
}

export interface VisitWithCustomer extends Visit {
  customer: Customer;
}

// --- Product ---

export interface Product {
  id: string;
  store_id: string;
  name: string;
  category: ProductCategory;
  price: number;
  cost: number;
  is_active: boolean;
  sort_order: number;
  stock: number;
  category_id: string | null;
  created_at: string;
}

// --- Order ---

export interface Order {
  id: string;
  store_id: string;
  visit_id: string | null;
  customer_id: string | null;
  staff_id: string | null;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
  customer?: Customer;
}

// --- Payment ---

export interface PaymentTransaction {
  id: string;
  store_id: string;
  visit_id: string | null;
  customer_id: string | null;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  created_at: string;
}

// --- Attendance ---

export interface AttendanceLog {
  id: string;
  store_id: string;
  staff_id: string;
  clock_in: string | null;
  clock_out: string | null;
  break_start: string | null;
  break_end: string | null;
  break_minutes: number;
  work_minutes: number | null;
  status: AttendanceStatus;
  created_at: string;
}

// --- Point / Chip ---

export interface PointLog {
  id: string;
  store_id: string;
  customer_id: string;
  change: number;
  balance_after: number;
  reason: string | null;
  created_at: string;
}

export interface ChipBalanceLog {
  id: string;
  store_id: string;
  customer_id: string;
  change: number;
  balance_after: number;
  reason: string | null;
  created_at: string;
}

// --- Prize ---

export interface PrizeLog {
  id: string;
  store_id: string;
  customer_id: string;
  prize_name: string;
  points_used: number;
  created_at: string;
}

// --- Inventory ---

export interface InventoryLog {
  id: string;
  store_id: string;
  product_id: string;
  change: number;
  stock_after: number;
  reason: string | null;
  created_at: string;
}

// --- Daily Closing ---

export interface DailyClosing {
  id: string;
  store_id: string;
  date: string;
  total_sales: number;
  total_cost: number;
  total_visitors: number;
  total_orders: number;
  cash_amount: number;
  card_amount: number;
  electronic_amount: number;
  notes: string | null;
  closed_by: string | null;
  closed_at: string | null;
  created_at: string;
}

// --- Sales Daily ---

export interface SalesDaily {
  id: string;
  store_id: string;
  date: string;
  product_id: string | null;
  quantity_sold: number;
  revenue: number;
  cost: number;
}

// --- Event ---

export interface EventRecord {
  id: string;
  store_id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  capacity: number | null;
  status: EventStatus;
  created_at: string;
}

export interface EventEntry {
  id: string;
  event_id: string;
  customer_id: string;
  status: EventEntryStatus;
  created_at: string;
}

// --- Announcement ---

export interface Announcement {
  id: string;
  store_id: string;
  title: string;
  body: string | null;
  target: AnnouncementTarget;
  published_at: string | null;
  created_at: string;
}

// --- Operation Log ---

export interface OperationLog {
  id: string;
  store_id: string;
  staff_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
}

// --- Dashboard / Analytics ---

export interface DailySummary {
  date: string;
  total_sales: number;
  total_visitors: number;
  total_orders: number;
  avg_spend: number;
}

export interface ProductSales {
  product_id: string;
  product_name: string;
  category: ProductCategory;
  quantity_sold: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface CustomerAnalytics {
  customer_id: string;
  customer_name: string;
  rank: CustomerRank;
  visit_count: number;
  total_spent: number;
  last_visit: string | null;
  avg_spend: number;
}

// ============================================================
// v2 追加型定義
// ============================================================

// --- Tag ---
export interface CustomerTagMaster {
  id: string; store_id: string; name: string; color: string | null;
  sort_order: number; is_active: boolean; created_at: string;
}
export interface CustomerTag {
  id: string; customer_id: string; tag_id: string; created_at: string;
}

// --- Rank Master ---
export interface CustomerRankMaster {
  id: string; store_id: string; rank_code: string; rank_name: string;
  min_visits: number; min_spent: number; point_multiplier: number;
  sort_order: number; created_at: string;
}

// --- Customer Status Log ---
export interface CustomerStatusLog {
  id: string; store_id: string; customer_id: string;
  from_rank: string | null; to_rank: string; reason: string | null;
  changed_by: string; created_at: string;
}

// --- Product Category ---
export interface ProductCategoryRecord {
  id: string; store_id: string; name: string;
  sort_order: number; is_active: boolean; created_at: string;
}

// --- Payment Method Master ---
export interface PaymentMethodMaster {
  id: string; store_id: string; code: string; name: string;
  is_active: boolean; sort_order: number; created_at: string;
}

// --- Store Settings ---
export interface StoreSetting {
  id: string; store_id: string; key: string;
  value: Record<string, unknown> | null; updated_at: string;
}

// --- Wage Settings ---
export interface WageSetting {
  id: string; store_id: string; staff_id: string;
  base_hourly_wage: number; night_multiplier: number;
  holiday_multiplier: number;
  effective_from: string | null; effective_to: string | null;
  created_at: string;
}

// --- Prize Master ---
export interface PrizeMaster {
  id: string; store_id: string; name: string;
  description: string | null; points_required: number;
  stock: number; image_url: string | null;
  is_active: boolean; sort_order: number; created_at: string;
}

// --- Coupon Master ---
export interface CouponMaster {
  id: string; store_id: string; code: string; name: string;
  description: string | null;
  discount_type: "fixed" | "percent" | "free_item";
  discount_value: number; min_purchase: number;
  max_uses: number | null; current_uses: number;
  valid_from: string | null; valid_until: string | null;
  target_rank: string | null; is_active: boolean; created_at: string;
}

// --- Customer Coupon ---
export interface CustomerCoupon {
  id: string; coupon_id: string; customer_id: string;
  status: "active" | "used" | "expired" | "revoked";
  used_at: string | null; visit_id: string | null; created_at: string;
}
export interface CustomerCouponWithMaster extends CustomerCoupon {
  coupon: CouponMaster;
}

// --- Visit Status Log ---
export interface VisitStatusLog {
  id: string; visit_id: string; from_status: string;
  to_status: string; changed_by: string; created_at: string;
}

// --- Closing Adjustment ---
export interface ClosingAdjustmentLog {
  id: string; closing_id: string; field_name: string;
  old_value: number; new_value: number; reason: string;
  adjusted_by: string; created_at: string;
}

// --- Event Result ---
export interface EventResultLog {
  id: string; event_id: string; customer_id: string;
  ranking: number | null; prize_name: string | null;
  points_awarded: number; notes: string | null;
  created_by: string; created_at: string;
}

// --- Staff Role History ---
export interface StaffRoleHistory {
  id: string; store_id: string; staff_id: string;
  from_role: string | null; to_role: string;
  changed_by: string; reason: string | null; created_at: string;
}

// --- Extended existing types ---
export interface CustomerWithTags extends Customer {
  tags?: CustomerTagMaster[];
}

// --- HR Analytics ---
export interface StaffLabor {
  staff_id: string;
  staff_name: string;
  total_work_minutes: number;
  total_break_minutes: number;
  hourly_wage: number;
  total_cost: number;
  days_worked: number;
}
