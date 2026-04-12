"use server";

import { revalidatePath } from "next/cache";
import { customerCreateSchema } from "@/lib/validations/schemas";
import { createCustomer } from "@/lib/db/customers";

export async function createCustomerAction(formData: FormData) {
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
    await createCustomer({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      rank: parsed.data.rank as "regular" | "silver" | "gold" | "vip",
      notes: parsed.data.notes || null,
      line_id: null,
    });
    revalidatePath("/customers");
    return { success: true };
  } catch (e) {
    console.error("createCustomer error:", e);
    return { error: "顧客の登録に失敗しました" };
  }
}
