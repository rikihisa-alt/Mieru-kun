"use server";

import { revalidatePath } from "next/cache";
import { createDailyClosing, getDailyClosing } from "@/lib/db/daily-closings";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";

export async function executeClosingAction(formData: FormData) {
  // 1. 認証・権限 (manager以上)
  let ctx;
  try {
    ctx = await requireRole("manager");
  } catch {
    return { error: "締め処理にはマネージャー以上の権限が必要です" };
  }

  const date = formData.get("date") as string;
  const notes = formData.get("notes") as string;

  // 2. 入力値検証
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { error: "日付形式が不正です" };
  }

  // 3. 二重締めチェック
  const existing = await getDailyClosing(date);
  if (existing) {
    return { error: "この日付は既に締め処理済みです" };
  }

  try {
    const supabase = await createClient();

    // 4. 未精算チェック（activeなvisitが残っていないか）
    const { count: activeCount } = await supabase
      .from("visits")
      .select("id", { count: "exact", head: true })
      .eq("store_id", ctx.storeId)
      .eq("status", "active")
      .gte("check_in_at", `${date}T00:00:00`)
      .lte("check_in_at", `${date}T23:59:59`);

    if ((activeCount ?? 0) > 0) {
      return { error: `未精算の来店が${activeCount}件あります。先に精算してください` };
    }

    // 5. 当日データ集計
    const [visitsRes, ordersRes, paymentsRes] = await Promise.all([
      supabase
        .from("visits")
        .select("id")
        .eq("store_id", ctx.storeId)
        .gte("check_in_at", `${date}T00:00:00`)
        .lte("check_in_at", `${date}T23:59:59`),
      supabase
        .from("orders")
        .select("total_amount")
        .eq("store_id", ctx.storeId)
        .eq("status", "confirmed")
        .gte("created_at", `${date}T00:00:00`)
        .lte("created_at", `${date}T23:59:59`),
      supabase
        .from("payment_transactions")
        .select("amount, method")
        .eq("store_id", ctx.storeId)
        .eq("status", "completed")
        .gte("created_at", `${date}T00:00:00`)
        .lte("created_at", `${date}T23:59:59`),
    ]);

    const payments = paymentsRes.data ?? [];
    const totalSales = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const cashAmount = payments
      .filter((p) => p.method === "cash")
      .reduce((s, p) => s + (p.amount || 0), 0);
    const cardAmount = payments
      .filter((p) => p.method === "card")
      .reduce((s, p) => s + (p.amount || 0), 0);
    const electronicAmount = payments
      .filter((p) => p.method === "electronic")
      .reduce((s, p) => s + (p.amount || 0), 0);

    const closingData = {
      date,
      total_sales: totalSales,
      total_cost: 0,
      total_visitors: visitsRes.data?.length ?? 0,
      total_orders: ordersRes.data?.length ?? 0,
      cash_amount: cashAmount,
      card_amount: cardAmount,
      electronic_amount: electronicAmount,
      notes: notes || undefined,
      closed_by: ctx.userId,
    };

    // 6. 締めデータ保存
    const closing = await createDailyClosing(closingData);

    // 7. 監査ログ
    await writeAuditLog({
      ctx,
      action: "closing.execute",
      targetTable: "daily_closings",
      targetId: closing.id,
      after: closingData,
    });

    revalidatePath("/w2f6yp");
    revalidatePath("/h7p2kx");
    return { success: true };
  } catch (e) {
    console.error("closing error:", e);
    return { error: "締め処理に失敗しました" };
  }
}
