"use server";

import { revalidatePath } from "next/cache";
import { customerCreateSchema } from "@/lib/validations/schemas";
import { createCustomer } from "@/lib/db/customers";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function createCustomerAction(formData: FormData) {
  // 1. 認証・権限チェック
  let ctx;
  try {
    ctx = await requireRole("staff");
  } catch {
    return { error: "権限がありません" };
  }

  // 2. 入力値検証
  const raw = {
    name: formData.get("name") as string,
    phone: formData.get("phone") as string,
    email: formData.get("email") as string,
    rank: (formData.get("rank") as string) || "regular",
    notes: formData.get("notes") as string,
  };

  const parsed = customerCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    // 3. DB操作（store_idはAuthContextから取得）
    const customer = await createCustomer({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      rank: parsed.data.rank as "regular" | "silver" | "gold" | "vip",
      notes: parsed.data.notes || null,
      line_id: null,
    });

    // 4. 監査ログ記録
    await writeAuditLog({
      ctx,
      action: "customer.create",
      targetTable: "customers",
      targetId: customer.id,
      after: { name: customer.name, rank: customer.rank },
    });

    revalidatePath("/customers");
    return { success: true };
  } catch (e) {
    console.error("createCustomer error:", e);
    return { error: "顧客の登録に失敗しました" };
  }
}
