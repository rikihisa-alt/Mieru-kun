"use server";

import { requireRole } from "@/lib/auth";

export async function scheduleNotificationAction() {
  // 1. 認証・権限チェック
  try {
    await requireRole("manager");
  } catch {
    return { error: "権限がありません" };
  }

  // スタブ: 今後実装予定
  return { error: "通知機能は今後実装予定です" };
}
