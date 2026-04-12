"use server";

import { exportDateRangeSchema } from "@/lib/validations/schemas";
import { getSalesExportData } from "@/lib/db/export";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { hasMinimumRole } from "@/lib/auth";

export async function exportSalesAction(formData: FormData) {
  // 1. 認証・権限チェック (manager+ または accounting)
  let ctx;
  try {
    ctx = await requireRole("staff");
  } catch {
    return { error: "権限がありません" };
  }

  if (
    !hasMinimumRole(ctx.role, "manager") &&
    ctx.role !== "accounting"
  ) {
    return { error: "権限がありません" };
  }

  // 2. 入力値検証
  const raw = {
    start_date: formData.get("start_date") as string,
    end_date: formData.get("end_date") as string,
  };

  const parsed = exportDateRangeSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    // 3. エクスポートデータ取得
    const data = await getSalesExportData(
      ctx.storeId,
      parsed.data.start_date,
      parsed.data.end_date
    );

    // 4. 監査ログ
    await writeAuditLog({
      ctx,
      action: "export.sales",
      detail: {
        start_date: parsed.data.start_date,
        end_date: parsed.data.end_date,
        record_count: data.length,
      },
    });

    return { success: true, data };
  } catch (e) {
    console.error("exportSales error:", e);
    return { error: "売上データのエクスポートに失敗しました" };
  }
}
