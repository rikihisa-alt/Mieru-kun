"use server";

import { revalidatePath } from "next/cache";
import { createDailyClosing, getDailyClosing } from "@/lib/db/daily-closings";
import { DEMO_STORE_ID } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export async function executeClosingAction(formData: FormData) {
  const date = formData.get("date") as string;
  const notes = formData.get("notes") as string;

  if (!date) {
    return { error: "日付が必要です" };
  }

  // 既に締め済みか確認
  const existing = await getDailyClosing(date);
  if (existing) {
    return { error: "この日付は既に締め処理済みです" };
  }

  try {
    const supabase = await createClient();

    // 当日データを集計
    const [visitsRes, ordersRes, paymentsRes] = await Promise.all([
      supabase
        .from("visits")
        .select("id")
        .eq("store_id", DEMO_STORE_ID)
        .gte("check_in_at", `${date}T00:00:00`)
        .lte("check_in_at", `${date}T23:59:59`),
      supabase
        .from("orders")
        .select("total_amount")
        .eq("store_id", DEMO_STORE_ID)
        .eq("status", "confirmed")
        .gte("created_at", `${date}T00:00:00`)
        .lte("created_at", `${date}T23:59:59`),
      supabase
        .from("payment_transactions")
        .select("amount, method")
        .eq("store_id", DEMO_STORE_ID)
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

    await createDailyClosing({
      date,
      total_sales: totalSales,
      total_cost: 0,
      total_visitors: visitsRes.data?.length ?? 0,
      total_orders: ordersRes.data?.length ?? 0,
      cash_amount: cashAmount,
      card_amount: cardAmount,
      electronic_amount: electronicAmount,
      notes: notes || undefined,
    });

    revalidatePath("/closing");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    console.error("closing error:", e);
    return { error: "締め処理に失敗しました" };
  }
}
