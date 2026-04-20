"use server";

import { revalidatePath } from "next/cache";
import { orderCreateSchema } from "@/lib/validations/schemas";
import { createOrder } from "@/lib/db/orders";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";

export async function createOrderAction(input: {
  visit_id: string;
  customer_id?: string;
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }[];
}) {
  // 1. 認証・権限
  let ctx;
  try {
    ctx = await requireRole("staff");
  } catch {
    return { error: "権限がありません" };
  }

  // 2. 入力値検証
  const parsed = orderCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    // 3. visitの店舗所属・ステータスチェック
    const supabase = await createClient();
    const { data: visit } = await supabase
      .from("visits")
      .select("id, store_id, status")
      .eq("id", parsed.data.visit_id)
      .single();

    if (!visit) {
      return { error: "来店データが見つかりません" };
    }
    if (visit.store_id !== ctx.storeId) {
      return { error: "この店舗のデータではありません" };
    }
    if (visit.status !== "active") {
      return { error: "精算済みの来店には注文できません" };
    }

    // 4. 商品の存在・店舗所属チェック
    const productIds = parsed.data.items.map((i) => i.product_id);
    const { data: products } = await supabase
      .from("products")
      .select("id, store_id, price, is_active")
      .in("id", productIds);

    for (const item of parsed.data.items) {
      const product = products?.find((p) => p.id === item.product_id);
      if (!product || product.store_id !== ctx.storeId) {
        return { error: `商品が見つかりません: ${item.product_name}` };
      }
      if (!product.is_active) {
        return { error: `${item.product_name}は現在販売停止中です` };
      }
      // サーバー側で価格を検証（フロントの価格改ざん防止）
      if (item.unit_price !== product.price) {
        return { error: `${item.product_name}の価格が変更されています。再度お試しください` };
      }
    }

    // 5. 注文作成
    const order = await createOrder({
      visit_id: parsed.data.visit_id,
      customer_id: parsed.data.customer_id,
      staff_id: ctx.userId,
      items: parsed.data.items,
    });

    // 6. 監査ログ
    const totalAmount = parsed.data.items.reduce(
      (sum, i) => sum + i.quantity * i.unit_price,
      0
    );
    await writeAuditLog({
      ctx,
      action: "order.create",
      targetTable: "orders",
      targetId: order.id,
      after: {
        visit_id: parsed.data.visit_id,
        items_count: parsed.data.items.length,
        total_amount: totalAmount,
      },
    });

    revalidatePath("/x6j2fp");
    revalidatePath("/checkout");
    revalidatePath("/home");
    return { success: true };
  } catch (e) {
    console.error("createOrder error:", e);
    return { error: "注文の登録に失敗しました" };
  }
}
