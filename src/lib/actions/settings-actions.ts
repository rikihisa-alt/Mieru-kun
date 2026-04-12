"use server";

import { revalidatePath } from "next/cache";
import {
  storeSettingSchema,
  storeInfoSchema,
} from "@/lib/validations/schemas";
import {
  upsertStoreSetting,
  updateStoreInfo,
} from "@/lib/db/settings";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function updateStoreSettingAction(formData: FormData) {
  // 1. 認証・権限チェック
  let ctx;
  try {
    ctx = await requireRole("owner");
  } catch {
    return { error: "権限がありません" };
  }

  // 2. 入力値検証
  const raw = {
    key: formData.get("key") as string,
    value: formData.get("value") as string,
  };

  const parsed = storeSettingSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    // 3. 設定更新
    await upsertStoreSetting(
      ctx.storeId,
      parsed.data.key,
      { value: parsed.data.value }
    );

    // 4. 監査ログ
    await writeAuditLog({
      ctx,
      action: "settings.update",
      targetTable: "store_settings",
      detail: {
        key: parsed.data.key,
        value: parsed.data.value,
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    console.error("updateStoreSetting error:", e);
    return { error: "設定の更新に失敗しました" };
  }
}

export async function updateStoreInfoAction(formData: FormData) {
  // 1. 認証・権限チェック
  let ctx;
  try {
    ctx = await requireRole("owner");
  } catch {
    return { error: "権限がありません" };
  }

  // 2. 入力値検証
  const raw = {
    name: formData.get("name") as string,
    display_name: formData.get("display_name") as string,
    address: formData.get("address") as string,
    phone: formData.get("phone") as string,
  };

  const parsed = storeInfoSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    // 3. 店舗情報更新
    await updateStoreInfo(ctx.storeId, parsed.data);

    // 4. 監査ログ
    await writeAuditLog({
      ctx,
      action: "store.update",
      targetTable: "stores",
      targetId: ctx.storeId,
      after: parsed.data,
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    console.error("updateStoreInfo error:", e);
    return { error: "店舗情報の更新に失敗しました" };
  }
}
