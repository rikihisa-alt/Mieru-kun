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

  // Phase 1 拡張フィールド（DB側マイグレーション phase1_customer_perm.sql 適用後に有効）
  // 現時点では生年月日・LINE ID・紹介者・SNS等は notes に埋め込んで記録
  const nickname = (formData.get("nickname") as string) || "";
  const dob = (formData.get("date_of_birth") as string) || "";
  const lineId = (formData.get("line_id") as string) || "";
  const referrer = (formData.get("referrer_name") as string) || "";
  const caution = (formData.get("caution_text") as string) || "";
  const isBlacklisted = formData.get("is_blacklisted") === "true";
  const isHidden = formData.get("is_hidden") === "true";
  const snsLinksRaw = (formData.get("sns_links") as string) || "{}";

  const extensionMeta = [
    nickname && `nickname:${nickname}`,
    dob && `DOB:${dob}`,
    lineId && `LINE:${lineId}`,
    referrer && `紹介:${referrer}`,
    caution && `⚠ ${caution}`,
    isBlacklisted && "BLACK",
    isHidden && "HIDDEN",
    snsLinksRaw !== "{}" && `SNS:${snsLinksRaw}`,
  ]
    .filter(Boolean)
    .join(" / ");

  const combinedNotes = [parsed.data.notes, extensionMeta].filter(Boolean).join("\n---\n");

  try {
    const customer = await createCustomer({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      rank: parsed.data.rank as "regular" | "silver" | "gold" | "vip",
      notes: combinedNotes || null,
      line_id: lineId || null,
    });

    await writeAuditLog({
      ctx,
      action: "customer.create",
      targetTable: "customers",
      targetId: customer.id,
      after: { name: customer.name, rank: customer.rank, nickname, has_caution: !!caution, is_blacklisted: isBlacklisted, is_hidden: isHidden },
    });

    revalidatePath("/a9k5dm");
    return { success: true };
  } catch (e) {
    console.error("createCustomer error:", e);
    return { error: "顧客の登録に失敗しました" };
  }
}
