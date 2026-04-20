"use server";

import { revalidatePath } from "next/cache";
import { inventoryAdjustSchema } from "@/lib/validations/schemas";
import { adjustInventory } from "@/lib/db/inventory";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";

export async function adjustInventoryAction(formData: FormData) {
  // 1. 認証・権限チェック
  let ctx;
  try {
    ctx = await requireRole("manager");
  } catch {
    return { error: "権限がありません" };
  }

  // 2. 入力値検証
  const raw = {
    product_id: formData.get("product_id") as string,
    change: Number(formData.get("change")),
    reason: formData.get("reason") as string,
  };

  const parsed = inventoryAdjustSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const supabase = await createClient();

    // 3. 商品の店舗所属チェック
    const { data: product } = await supabase
      .from("products")
      .select("id, store_id, name")
      .eq("id", parsed.data.product_id)
      .single();

    if (!product || product.store_id !== ctx.storeId) {
      return { error: "商品が見つかりません" };
    }

    // 4. 在庫調整
    const result = await adjustInventory({
      storeId: ctx.storeId,
      productId: parsed.data.product_id,
      change: parsed.data.change,
      reason: parsed.data.reason,
    });

    // 5. 監査ログ
    await writeAuditLog({
      ctx,
      action: "inventory.adjust",
      targetTable: "inventory_logs",
      targetId: result.id,
      after: {
        product_id: parsed.data.product_id,
        product_name: product.name,
        change: parsed.data.change,
        reason: parsed.data.reason,
      },
    });

    revalidatePath("/inventory");
    revalidatePath("/p5d7mg");
    return { success: true };
  } catch (e) {
    console.error("adjustInventory error:", e);
    return { error: "在庫調整に失敗しました" };
  }
}
