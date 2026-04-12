"use server";

import { revalidatePath } from "next/cache";
import { roleChangeSchema } from "@/lib/validations/schemas";
import { updateStaffRole } from "@/lib/db/staff";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";

export async function changeStaffRoleAction(formData: FormData) {
  // 1. 認証・権限チェック
  let ctx;
  try {
    ctx = await requireRole("owner");
  } catch {
    return { error: "権限がありません" };
  }

  // 2. 入力値検証
  const raw = {
    target_user_id: formData.get("target_user_id") as string,
    new_role: formData.get("new_role") as string,
  };

  const parsed = roleChangeSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // 3. 自分自身のロール変更は不可
  if (parsed.data.target_user_id === ctx.userId) {
    return { error: "自分自身のロールは変更できません" };
  }

  try {
    const supabase = await createClient();

    // 4. 対象ユーザーの店舗所属チェック
    const { data: targetUser } = await supabase
      .from("staff_users")
      .select("id, store_id, role")
      .eq("id", parsed.data.target_user_id)
      .single();

    if (!targetUser || targetUser.store_id !== ctx.storeId) {
      return { error: "対象のスタッフが見つかりません" };
    }

    const oldRole = targetUser.role;

    // 5. ロール変更
    await updateStaffRole(
      parsed.data.target_user_id,
      parsed.data.new_role,
      ctx.userId,
      ctx.storeId
    );

    // 6. 監査ログ
    await writeAuditLog({
      ctx,
      action: "role.change",
      targetTable: "staff_users",
      targetId: parsed.data.target_user_id,
      before: { role: oldRole },
      after: { role: parsed.data.new_role },
    });

    revalidatePath("/staff");
    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    console.error("changeStaffRole error:", e);
    return { error: "ロールの変更に失敗しました" };
  }
}
