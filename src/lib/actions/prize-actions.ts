"use server";

import { revalidatePath } from "next/cache";
import { prizeGrantSchema } from "@/lib/validations/schemas";
import { grantPrize } from "@/lib/db/prizes";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";

export async function grantPrizeAction(formData: FormData) {
  // 1. 認証・権限チェック
  let ctx;
  try {
    ctx = await requireRole("staff");
  } catch {
    return { error: "権限がありません" };
  }

  // 2. 入力値検証
  const raw = {
    customer_id: formData.get("customer_id") as string,
    prize_master_id: formData.get("prize_master_id") as string,
  };

  const parsed = prizeGrantSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const supabase = await createClient();

    // 3. 顧客の店舗所属・ポイント残高チェック
    const { data: customer } = await supabase
      .from("customers")
      .select("id, store_id, point_balance")
      .eq("id", parsed.data.customer_id)
      .single();

    if (!customer || customer.store_id !== ctx.storeId) {
      return { error: "顧客が見つかりません" };
    }

    // 4. 景品マスタの存在・在庫チェック
    const { data: prize } = await supabase
      .from("prize_masters")
      .select("id, store_id, points_required, stock, name")
      .eq("id", parsed.data.prize_master_id)
      .single();

    if (!prize || prize.store_id !== ctx.storeId) {
      return { error: "景品が見つかりません" };
    }

    if (customer.point_balance < prize.points_required) {
      return { error: "ポイントが不足しています" };
    }

    if (prize.stock <= 0) {
      return { error: "景品の在庫がありません" };
    }

    // 5. 景品付与実行
    const result = await grantPrize({
      customerId: parsed.data.customer_id,
      prizeMasterId: parsed.data.prize_master_id,
      prizeName: prize.name,
      pointsUsed: prize.points_required,
      staffId: ctx.userId,
      storeId: ctx.storeId,
    });

    // 6. 監査ログ
    await writeAuditLog({
      ctx,
      action: "prize.grant",
      targetTable: "prize_logs",
      targetId: result.id,
      after: {
        customer_id: parsed.data.customer_id,
        prize_master_id: parsed.data.prize_master_id,
        prize_name: prize.name,
        points_required: prize.points_required,
      },
    });

    revalidatePath("/prizes");
    revalidatePath("/a9k5dm");
    return { success: true };
  } catch (e) {
    console.error("grantPrize error:", e);
    return { error: "景品の付与に失敗しました" };
  }
}
