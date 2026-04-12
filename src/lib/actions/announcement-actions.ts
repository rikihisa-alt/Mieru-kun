"use server";

import { revalidatePath } from "next/cache";
import { announcementCreateSchema } from "@/lib/validations/schemas";
import { createAnnouncement } from "@/lib/db/announcements";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function createAnnouncementAction(formData: FormData) {
  // 1. 認証・権限チェック
  let ctx;
  try {
    ctx = await requireRole("manager");
  } catch {
    return { error: "権限がありません" };
  }

  // 2. 入力値検証
  const raw = {
    title: formData.get("title") as string,
    body: formData.get("body") as string,
    target: formData.get("target") as string,
  };

  const parsed = announcementCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    // 3. お知らせ作成
    const announcement = await createAnnouncement({
      title: parsed.data.title,
      body: parsed.data.body || undefined,
      target: parsed.data.target,
      storeId: ctx.storeId,
    });

    // 4. 監査ログ
    await writeAuditLog({
      ctx,
      action: "announcement.create",
      targetTable: "announcements",
      targetId: announcement.id,
      after: {
        title: parsed.data.title,
        target: parsed.data.target,
      },
    });

    revalidatePath("/admin-announcements");
    return { success: true };
  } catch (e) {
    console.error("createAnnouncement error:", e);
    return { error: "お知らせの作成に失敗しました" };
  }
}
