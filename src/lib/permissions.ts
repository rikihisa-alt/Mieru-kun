/**
 * 権限判定 (クライアント/サーバー共通ユーティリティ)
 *
 * Phase 1 スコープ:
 *  - owner: すべての操作 + 個人情報エクスポート + 監査ログ閲覧
 *  - manager: 顧客/会計/チップ/イベント編集、同意履歴・ブラック削除不可
 *  - staff: 来店/会計/チップ操作のみ、個人情報の一部閲覧不可
 */

export type Role = "owner" | "manager" | "staff";

export interface Permission {
  // 顧客
  viewSensitiveCustomerInfo: boolean; // 生年月日/LINE ID/紹介者/住所
  editCustomer: boolean;
  deleteCustomer: boolean;
  exportCustomer: boolean;
  toggleBlacklist: boolean;
  toggleHidden: boolean;
  // チップ/マルチケ
  adjustTipManual: boolean; // 手動調整・凍結・取消
  // イベント/POP
  manageEvents: boolean;
  // 設定/ルール
  editPointRules: boolean;
  // 監査
  viewAuditLogs: boolean;
}

const PERMISSIONS: Record<Role, Permission> = {
  owner: {
    viewSensitiveCustomerInfo: true,
    editCustomer: true,
    deleteCustomer: true,
    exportCustomer: true,
    toggleBlacklist: true,
    toggleHidden: true,
    adjustTipManual: true,
    manageEvents: true,
    editPointRules: true,
    viewAuditLogs: true,
  },
  manager: {
    viewSensitiveCustomerInfo: true,
    editCustomer: true,
    deleteCustomer: false,
    exportCustomer: false,
    toggleBlacklist: false,
    toggleHidden: true,
    adjustTipManual: true,
    manageEvents: true,
    editPointRules: false,
    viewAuditLogs: false,
  },
  staff: {
    viewSensitiveCustomerInfo: false,
    editCustomer: false,
    deleteCustomer: false,
    exportCustomer: false,
    toggleBlacklist: false,
    toggleHidden: false,
    adjustTipManual: false,
    manageEvents: false,
    editPointRules: false,
    viewAuditLogs: false,
  },
};

export function can(role: Role | null | undefined, perm: keyof Permission): boolean {
  if (!role) return false;
  return PERMISSIONS[role]?.[perm] ?? false;
}

export function getPermissions(role: Role | null | undefined): Permission {
  return role ? PERMISSIONS[role] : PERMISSIONS.staff;
}
