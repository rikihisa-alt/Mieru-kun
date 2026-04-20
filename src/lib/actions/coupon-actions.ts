"use server";

import { revalidatePath } from "next/cache";
import { couponIssueSchema } from "@/lib/validations/schemas";
import { issueCoupon, useCoupon } from "@/lib/db/coupons";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export async function issueCouponAction(formData: FormData) {
  // 1. 認証・権限チェック
  let ctx;
  try {
    ctx = await requireRole("staff");
  } catch {
    return { error: "権限がありません" };
  }

  // 2. 入力値検証
  const raw = {
    coupon_id: formData.get("coupon_id") as string,
    customer_id: formData.get("customer_id") as string,
  };

  const parsed = couponIssueSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const supabase = await createClient();

    // 3. クーポンの存在・有効性チェック
    const { data: coupon } = await supabase
      .from("coupons")
      .select("id, store_id, is_active, expires_at, name")
      .eq("id", parsed.data.coupon_id)
      .single();

    if (!coupon || coupon.store_id !== ctx.storeId) {
      return { error: "クーポンが見つかりません" };
    }

    if (!coupon.is_active) {
      return { error: "このクーポンは無効です" };
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return { error: "このクーポンは期限切れです" };
    }

    // 4. 顧客の店舗所属チェック
    const { data: customer } = await supabase
      .from("customers")
      .select("id, store_id")
      .eq("id", parsed.data.customer_id)
      .single();

    if (!customer || customer.store_id !== ctx.storeId) {
      return { error: "顧客が見つかりません" };
    }

    // 5. クーポン発行
    const result = await issueCoupon({
      couponId: parsed.data.coupon_id,
      customerId: parsed.data.customer_id,
    });

    // 6. 監査ログ
    await writeAuditLog({
      ctx,
      action: "coupon.issue",
      targetTable: "customer_coupons",
      targetId: result.id,
      after: {
        coupon_id: parsed.data.coupon_id,
        customer_id: parsed.data.customer_id,
        coupon_name: coupon.name,
      },
    });

    revalidatePath("/coupons");
    revalidatePath("/a9k5dm");
    return { success: true };
  } catch (e) {
    console.error("issueCoupon error:", e);
    return { error: "クーポンの発行に失敗しました" };
  }
}

export async function useCouponAction(formData: FormData) {
  // 1. 認証・権限チェック
  let ctx;
  try {
    ctx = await requireRole("staff");
  } catch {
    return { error: "権限がありません" };
  }

  // 2. 入力値検証
  const customerCouponId = formData.get("customer_coupon_id") as string;
  const visitId = formData.get("visit_id") as string;

  const schema = z.object({
    customer_coupon_id: z.string().uuid("不正なIDです"),
    visit_id: z.string().uuid("不正なIDです"),
  });

  const parsed = schema.safeParse({
    customer_coupon_id: customerCouponId,
    visit_id: visitId,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const supabase = await createClient();

    // 3. 顧客クーポンの存在・ステータスチェック
    const { data: customerCoupon } = await supabase
      .from("customer_coupons")
      .select("id, store_id, status, coupon_id, customer_id")
      .eq("id", parsed.data.customer_coupon_id)
      .single();

    if (!customerCoupon || customerCoupon.store_id !== ctx.storeId) {
      return { error: "クーポンが見つかりません" };
    }

    if (customerCoupon.status !== "active") {
      return { error: "このクーポンは使用できません" };
    }

    // 4. クーポン使用
    await useCoupon(parsed.data.customer_coupon_id, parsed.data.visit_id);

    // 5. 監査ログ
    await writeAuditLog({
      ctx,
      action: "coupon.use",
      targetTable: "customer_coupons",
      targetId: parsed.data.customer_coupon_id,
      after: {
        visit_id: parsed.data.visit_id,
        coupon_id: customerCoupon.coupon_id,
        customer_id: customerCoupon.customer_id,
      },
    });

    revalidatePath("/coupons");
    revalidatePath("/checkout");
    return { success: true };
  } catch (e) {
    console.error("useCoupon error:", e);
    return { error: "クーポンの使用に失敗しました" };
  }
}
