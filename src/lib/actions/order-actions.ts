"use server";

import { revalidatePath } from "next/cache";
import { createOrder } from "@/lib/db/orders";

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
  if (!input.visit_id) {
    return { error: "来店を選択してください" };
  }
  if (!input.items || input.items.length === 0) {
    return { error: "商品を1つ以上選択してください" };
  }

  try {
    await createOrder({
      visit_id: input.visit_id,
      customer_id: input.customer_id,
      items: input.items,
    });
    revalidatePath("/orders");
    revalidatePath("/checkout");
    revalidatePath("/home");
    return { success: true };
  } catch (e) {
    console.error("createOrder error:", e);
    return { error: "注文の登録に失敗しました" };
  }
}
