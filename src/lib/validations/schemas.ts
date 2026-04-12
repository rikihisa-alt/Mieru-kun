import { z } from "zod";

// --- 共通バリデーション ---
const uuidSchema = z.string().uuid("不正なIDです");
const positiveInt = z.number().int().min(0, "0以上の値を入力してください");
const requiredString = (field: string) =>
  z.string().min(1, `${field}は必須です`).max(200);

// --- Customer ---
export const customerCreateSchema = z.object({
  name: requiredString("名前"),
  phone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("メールアドレスの形式が不正です").optional().or(z.literal("")),
  rank: z.enum(["regular", "silver", "gold", "vip"]).default("regular"),
  notes: z.string().max(500).optional().or(z.literal("")),
});
export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;

// --- Visit (Check-in) ---
export const checkinSchema = z.object({
  customer_id: uuidSchema,
  table_number: z.string().max(20).optional().or(z.literal("")),
});
export type CheckinInput = z.infer<typeof checkinSchema>;

// --- Checkout ---
export const checkoutSchema = z.object({
  visit_id: uuidSchema,
  total_amount: positiveInt,
  method: z.enum(["cash", "card", "electronic"]),
  customer_id: uuidSchema.optional(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

// --- Order ---
export const orderItemSchema = z.object({
  product_id: uuidSchema,
  product_name: z.string().min(1),
  quantity: z.number().int().min(1, "数量は1以上"),
  unit_price: positiveInt,
});

export const orderCreateSchema = z.object({
  visit_id: uuidSchema,
  customer_id: uuidSchema.optional(),
  items: z.array(orderItemSchema).min(1, "商品を1つ以上選択してください"),
});
export type OrderCreateInput = z.infer<typeof orderCreateSchema>;

// --- Payment ---
export const paymentSchema = z.object({
  visit_id: uuidSchema,
  customer_id: uuidSchema.optional(),
  amount: positiveInt,
  method: z.enum(["cash", "card", "electronic"]),
});
export type PaymentInput = z.infer<typeof paymentSchema>;

// --- Product ---
export const productCreateSchema = z.object({
  name: requiredString("商品名"),
  category: z.enum(["drink", "food", "chip", "other"]),
  price: positiveInt,
  cost: positiveInt.default(0),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});
export type ProductCreateInput = z.infer<typeof productCreateSchema>;

// --- Attendance ---
export const attendanceActionSchema = z.object({
  action: z.enum(["clock_in", "clock_out", "break_start", "break_end"]),
});
export type AttendanceActionInput = z.infer<typeof attendanceActionSchema>;

// --- Daily Closing ---
export const closingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付形式が不正です"),
  notes: z.string().max(500).optional().or(z.literal("")),
});
export type ClosingInput = z.infer<typeof closingSchema>;

// --- Chip / Point ---
export const chipChangeSchema = z.object({
  customer_id: uuidSchema,
  change: z.number().int().refine((v) => v !== 0, "0は指定できません"),
  reason: requiredString("理由"),
});
export type ChipChangeInput = z.infer<typeof chipChangeSchema>;

export const pointChangeSchema = z.object({
  customer_id: uuidSchema,
  change: z.number().int().refine((v) => v !== 0, "0は指定できません"),
  reason: requiredString("理由"),
});
export type PointChangeInput = z.infer<typeof pointChangeSchema>;

// --- Role Change ---
export const roleChangeSchema = z.object({
  target_user_id: uuidSchema,
  new_role: z.enum(["staff", "manager", "owner", "accounting"]),
});
export type RoleChangeInput = z.infer<typeof roleChangeSchema>;

// --- Prize Grant ---
export const prizeGrantSchema = z.object({
  customer_id: uuidSchema,
  prize_master_id: uuidSchema,
});
export type PrizeGrantInput = z.infer<typeof prizeGrantSchema>;

// --- Coupon ---
export const couponIssueSchema = z.object({
  coupon_id: uuidSchema,
  customer_id: uuidSchema,
});
export type CouponIssueInput = z.infer<typeof couponIssueSchema>;

// --- Event ---
export const eventCreateSchema = z.object({
  title: requiredString("イベント名"),
  event_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "日付形式が不正です")
    .optional()
    .or(z.literal("")),
  capacity: z.number().int().min(1, "定員は1以上").optional(),
  event_type: z.enum(["tournament", "campaign", "other"]).optional(),
  entry_fee: z.number().int().min(0, "参加費は0以上").optional(),
});
export type EventCreateInput = z.infer<typeof eventCreateSchema>;

export const eventEntrySchema = z.object({
  event_id: uuidSchema,
  customer_id: uuidSchema,
});
export type EventEntryInput = z.infer<typeof eventEntrySchema>;

// --- Announcement ---
export const announcementCreateSchema = z.object({
  title: requiredString("タイトル"),
  body: z.string().max(2000).optional().or(z.literal("")),
  target: z.enum(["all", "staff", "customers"]),
});
export type AnnouncementCreateInput = z.infer<typeof announcementCreateSchema>;

// --- Inventory ---
export const inventoryAdjustSchema = z.object({
  product_id: uuidSchema,
  change: z.number().int().refine((v) => v !== 0, "0は指定できません"),
  reason: requiredString("理由"),
});
export type InventoryAdjustInput = z.infer<typeof inventoryAdjustSchema>;

// --- Store Settings ---
export const storeSettingSchema = z.object({
  key: requiredString("設定キー"),
  value: z.string(),
});
export type StoreSettingInput = z.infer<typeof storeSettingSchema>;

export const storeInfoSchema = z.object({
  name: z.string().max(200).optional().or(z.literal("")),
  display_name: z.string().max(200).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
});
export type StoreInfoInput = z.infer<typeof storeInfoSchema>;

// --- Export ---
export const exportDateRangeSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "開始日の形式が不正です"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "終了日の形式が不正です"),
});
export type ExportDateRangeInput = z.infer<typeof exportDateRangeSchema>;
