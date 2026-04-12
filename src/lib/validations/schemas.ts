import { z } from "zod";

// --- Customer ---
export const customerCreateSchema = z.object({
  name: z.string().min(1, "名前は必須です").max(100),
  phone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("メールアドレスの形式が不正です").optional().or(z.literal("")),
  rank: z.enum(["regular", "silver", "gold", "vip"]).default("regular"),
  notes: z.string().max(500).optional().or(z.literal("")),
});
export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;

// --- Visit (Check-in) ---
export const checkinSchema = z.object({
  customer_id: z.string().uuid("顧客を選択してください"),
  table_number: z.string().max(20).optional().or(z.literal("")),
});
export type CheckinInput = z.infer<typeof checkinSchema>;

// --- Order ---
export const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  product_name: z.string(),
  quantity: z.number().int().min(1, "数量は1以上"),
  unit_price: z.number().int().min(0),
});

export const orderCreateSchema = z.object({
  visit_id: z.string().uuid("来店を選択してください"),
  customer_id: z.string().uuid().optional(),
  items: z.array(orderItemSchema).min(1, "商品を1つ以上選択してください"),
});
export type OrderCreateInput = z.infer<typeof orderCreateSchema>;

// --- Payment ---
export const paymentSchema = z.object({
  visit_id: z.string().uuid(),
  customer_id: z.string().uuid().optional(),
  amount: z.number().int().min(0, "金額は0以上"),
  method: z.enum(["cash", "card", "electronic"]),
});
export type PaymentInput = z.infer<typeof paymentSchema>;

// --- Product ---
export const productCreateSchema = z.object({
  name: z.string().min(1, "商品名は必須です").max(100),
  category: z.enum(["drink", "food", "chip", "other"]),
  price: z.number().int().min(0, "価格は0以上"),
  cost: z.number().int().min(0, "原価は0以上").default(0),
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
