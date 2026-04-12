"use server";

import { revalidatePath } from "next/cache";
import { checkinSchema, checkoutSchema } from "@/lib/validations/schemas";
import { createVisit, checkoutVisit } from "@/lib/db/visits";
import { createPayment } from "@/lib/db/payments";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";

export async function checkinAction(formData: FormData) {
  // 1. 認証・権限
  let ctx;
  try {
    ctx = await requireRole("staff");
  } catch {
    return { error: "権限がありません" };
  }

  // 2. 入力値検証
  const parsed = checkinSchema.safeParse({
    customer_id: formData.get("customer_id") as string,
    table_number: formData.get("table_number") as string,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // 3. 顧客の店舗所属チェック
  try {
    const supabase = await createClient();
    const { data: customer } = await supabase
      .from("customers")
      .select("id, store_id, name")
      .eq("id", parsed.data.customer_id)
      .single();

    if (!customer || customer.store_id !== ctx.storeId) {
      return { error: "この顧客は対象外です" };
    }

    // 4. 二重入店チェック（同一顧客のactiveなvisitがないか）
    const { data: activeVisit } = await supabase
      .from("visits")
      .select("id")
      .eq("customer_id", parsed.data.customer_id)
      .eq("status", "active")
      .limit(1)
      .single();

    if (activeVisit) {
      return { error: `${customer.name}さんは既に来店中です` };
    }

    // 5. 入店登録
    const visit = await createVisit({
      customer_id: parsed.data.customer_id,
      staff_id: ctx.userId,
      table_number: parsed.data.table_number || undefined,
    });

    // 6. 監査ログ
    await writeAuditLog({
      ctx,
      action: "visit.checkin",
      targetTable: "visits",
      targetId: visit.id,
      after: {
        customer_id: parsed.data.customer_id,
        customer_name: customer.name,
        table_number: parsed.data.table_number,
      },
    });

    revalidatePath("/checkin");
    revalidatePath("/checkout");
    revalidatePath("/home");
    return { success: true };
  } catch (e) {
    console.error("checkin error:", e);
    return { error: "入店登録に失敗しました" };
  }
}

export async function checkoutAction(formData: FormData) {
  // 1. 認証・権限
  let ctx;
  try {
    ctx = await requireRole("staff");
  } catch {
    return { error: "権限がありません" };
  }

  // 2. 入力値検証
  const parsed = checkoutSchema.safeParse({
    visit_id: formData.get("visit_id") as string,
    total_amount: parseInt(formData.get("total_amount") as string, 10) || 0,
    method: (formData.get("method") as string) || "cash",
    customer_id: formData.get("customer_id") as string || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    // 3. visitの存在・店舗所属・ステータスチェック
    const supabase = await createClient();
    const { data: visit } = await supabase
      .from("visits")
      .select("id, store_id, status, customer_id, total_amount")
      .eq("id", parsed.data.visit_id)
      .single();

    if (!visit) {
      return { error: "来店データが見つかりません" };
    }
    if (visit.store_id !== ctx.storeId) {
      return { error: "この店舗のデータではありません" };
    }
    if (visit.status !== "active") {
      return { error: "この来店は既に精算済みです" };
    }

    // 4. 支払い記録
    await createPayment({
      visit_id: parsed.data.visit_id,
      customer_id: visit.customer_id || undefined,
      amount: parsed.data.total_amount,
      method: parsed.data.method,
    });

    // 5. 退店処理
    const before = { status: visit.status, total_amount: visit.total_amount };
    await checkoutVisit(parsed.data.visit_id, parsed.data.total_amount);

    // 6. 監査ログ
    await writeAuditLog({
      ctx,
      action: "visit.checkout",
      targetTable: "visits",
      targetId: parsed.data.visit_id,
      before,
      after: {
        status: "settled",
        total_amount: parsed.data.total_amount,
        method: parsed.data.method,
      },
    });

    // 7. 支払いの監査ログ
    await writeAuditLog({
      ctx,
      action: "payment.create",
      targetTable: "payment_transactions",
      targetId: parsed.data.visit_id,
      after: {
        amount: parsed.data.total_amount,
        method: parsed.data.method,
      },
    });

    revalidatePath("/checkout");
    revalidatePath("/home");
    return { success: true };
  } catch (e) {
    console.error("checkout error:", e);
    return { error: "精算処理に失敗しました" };
  }
}
