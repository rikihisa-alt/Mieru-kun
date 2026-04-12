/**
 * 監査ログ (operation_logs) ヘルパー
 *
 * 重要操作は必ずこのモジュール経由で記録する。
 * 監査ログは不変。更新・削除は不可。
 */
import { createClient } from "@/lib/supabase/server";
import type { AuthContext } from "@/lib/auth";

export type AuditAction =
  | "login"
  | "logout"
  | "customer.create"
  | "customer.update"
  | "customer.delete"
  | "visit.checkin"
  | "visit.checkout"
  | "payment.create"
  | "chip.change"
  | "point.change"
  | "prize.grant"
  | "prize.revoke"
  | "closing.execute"
  | "closing.modify"
  | "inventory.adjust"
  | "attendance.clockin"
  | "attendance.clockout"
  | "attendance.break_start"
  | "attendance.break_end"
  | "attendance.modify"
  | "role.change"
  | "order.create"
  | "order.cancel"
  | "event.result"
  | "product.create"
  | "product.update"
  | "coupon.issue"
  | "coupon.use"
  | "event.create"
  | "event.register"
  | "announcement.create"
  | "settings.update"
  | "store.update"
  | "export.sales";

interface AuditLogInput {
  ctx: AuthContext;
  action: AuditAction;
  targetTable?: string;
  targetId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  detail?: Record<string, unknown>;
}

/**
 * 監査ログを記録する。
 * エラーが発生してもアプリケーションをクラッシュさせない。
 */
export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("operation_logs").insert({
      store_id: input.ctx.storeId,
      staff_id: input.ctx.userId,
      action: input.action,
      target_type: input.targetTable ?? null,
      target_id: input.targetId ?? null,
      before_data: input.before ?? null,
      after_data: input.after ?? null,
      detail: input.detail ?? null,
    });
  } catch (e) {
    // 監査ログの書き込み失敗はログに記録するが、
    // 本体処理は停止させない
    console.error("[AUDIT] Failed to write audit log:", e, input);
  }
}
