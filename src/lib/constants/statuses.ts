/** 来店ステータス */
export const VISIT_STATUSES = {
  active: { label: "来店中", color: "bg-green-100 text-green-700" },
  settled: { label: "精算済", color: "bg-blue-100 text-blue-700" },
  cancelled: { label: "キャンセル", color: "bg-gray-100 text-gray-500" },
} as const;

/** 注文ステータス */
export const ORDER_STATUSES = {
  pending: { label: "未確認", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "確定", color: "bg-green-100 text-green-700" },
  cancelled: { label: "取消", color: "bg-red-100 text-red-700" },
} as const;

/** 勤怠ステータス */
export const ATTENDANCE_STATUSES = {
  working: { label: "勤務中", color: "bg-green-100 text-green-700" },
  on_break: { label: "休憩中", color: "bg-yellow-100 text-yellow-700" },
  finished: { label: "退勤済", color: "bg-blue-100 text-blue-700" },
} as const;

/** 支払ステータス */
export const PAYMENT_STATUSES = {
  completed: { label: "完了", color: "bg-green-100 text-green-700" },
  refunded: { label: "返金", color: "bg-red-100 text-red-700" },
} as const;

/** イベントステータス */
export const EVENT_STATUSES = {
  draft: { label: "下書き", color: "bg-gray-100 text-gray-700" },
  published: { label: "公開中", color: "bg-green-100 text-green-700" },
  ended: { label: "終了", color: "bg-blue-100 text-blue-700" },
} as const;

/** クーポンステータス */
export const COUPON_STATUSES = {
  active: { label: "有効", color: "bg-green-100 text-green-700" },
  used: { label: "使用済", color: "bg-blue-100 text-blue-700" },
  expired: { label: "期限切れ", color: "bg-gray-100 text-gray-500" },
  revoked: { label: "取消", color: "bg-red-100 text-red-700" },
} as const;

/** プライズステータス */
export const PRIZE_STATUSES = {
  granted: { label: "付与済", color: "bg-green-100 text-green-700" },
  revoked: { label: "取消", color: "bg-red-100 text-red-700" },
} as const;

/** 在庫変動種別 */
export const INVENTORY_TYPES = {
  purchase: { label: "入庫", color: "bg-green-100 text-green-700" },
  sale: { label: "販売", color: "bg-blue-100 text-blue-700" },
  adjustment: { label: "調整", color: "bg-yellow-100 text-yellow-700" },
  loss: { label: "ロス", color: "bg-red-100 text-red-700" },
} as const;

/** ステータスのラベル取得ユーティリティ */
export function statusLabel(
  statusMap: Record<string, { label: string }>,
  status: string
): string {
  return statusMap[status]?.label ?? status;
}

export function statusColor(
  statusMap: Record<string, { color: string }>,
  status: string
): string {
  return statusMap[status]?.color ?? "bg-gray-100 text-gray-700";
}
