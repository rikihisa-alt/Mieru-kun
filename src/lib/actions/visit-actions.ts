"use server";

import { revalidatePath } from "next/cache";
import { checkinSchema } from "@/lib/validations/schemas";
import { createVisit, checkoutVisit } from "@/lib/db/visits";
import { createPayment } from "@/lib/db/payments";

export async function checkinAction(formData: FormData) {
  const raw = {
    customer_id: formData.get("customer_id") as string,
    table_number: formData.get("table_number") as string,
  };

  const parsed = checkinSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await createVisit({
      customer_id: parsed.data.customer_id,
      table_number: parsed.data.table_number || undefined,
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
  const visitId = formData.get("visit_id") as string;
  const totalAmount = parseInt(formData.get("total_amount") as string, 10) || 0;
  const method = (formData.get("method") as string) || "cash";
  const customerId = formData.get("customer_id") as string;

  if (!visitId) {
    return { error: "来店IDが必要です" };
  }

  try {
    // 支払い記録
    await createPayment({
      visit_id: visitId,
      customer_id: customerId || undefined,
      amount: totalAmount,
      method: method as "cash" | "card" | "electronic",
    });

    // 退店処理
    await checkoutVisit(visitId, totalAmount);

    revalidatePath("/checkout");
    revalidatePath("/home");
    return { success: true };
  } catch (e) {
    console.error("checkout error:", e);
    return { error: "精算処理に失敗しました" };
  }
}
