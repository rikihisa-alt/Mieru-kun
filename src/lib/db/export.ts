import { createClient } from "@/lib/supabase/server";

/** 売上CSV用データ取得 */
export async function getSalesExportData(
  storeId: string,
  startDate: string,
  endDate: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_transactions")
    .select("id, amount, method, status, created_at, visit_id, customer_id")
    .eq("store_id", storeId)
    .eq("status", "completed")
    .gte("created_at", `${startDate}T00:00:00`)
    .lte("created_at", `${endDate}T23:59:59`)
    .order("created_at");
  if (error) throw error;
  return data ?? [];
}

/** 顧客CSV用データ取得 (個人情報含む→role制御で呼び分け) */
export async function getCustomersExportData(storeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, phone, email, rank, total_visits, total_spent, chip_balance, point_balance, created_at")
    .eq("store_id", storeId)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

/** 勤怠CSV用データ取得 */
export async function getAttendanceExportData(
  storeId: string,
  startDate: string,
  endDate: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance_logs")
    .select("id, staff_id, clock_in, clock_out, break_minutes, work_minutes, status, created_at")
    .eq("store_id", storeId)
    .gte("created_at", `${startDate}T00:00:00`)
    .lte("created_at", `${endDate}T23:59:59`)
    .order("created_at");
  if (error) throw error;
  return data ?? [];
}

/** 締め履歴CSV用データ取得 */
export async function getClosingsExportData(storeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_closings")
    .select("*")
    .eq("store_id", storeId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** 在庫履歴CSV用データ取得 */
export async function getInventoryExportData(
  storeId: string,
  startDate: string,
  endDate: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_logs")
    .select("id, product_id, change, stock_after, reason, created_at")
    .eq("store_id", storeId)
    .gte("created_at", `${startDate}T00:00:00`)
    .lte("created_at", `${endDate}T23:59:59`)
    .order("created_at");
  if (error) throw error;
  return data ?? [];
}
