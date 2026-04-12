/**
 * 認証・権限チェック ヘルパー
 *
 * 全てのServer Actionはこのモジュールを通じて
 * 認証状態・role・store_id を検証する。
 */
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { StaffRole } from "@/types/database";

export interface AuthContext {
  userId: string;
  storeId: string;
  role: StaffRole;
  name: string;
}

// ロールの階層 (数値が大きいほど権限が高い)
const ROLE_HIERARCHY: Record<string, number> = {
  staff: 1,
  accounting: 2,
  manager: 3,
  owner: 4,
  admin: 5,
};

/**
 * 現在の認証ユーザーのコンテキストを取得する。
 * 未認証の場合は null を返す。
 * デモモード時はダミーコンテキストを返す。
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  // デモモード: Supabase未接続時
  if (!isSupabaseConfigured()) {
    return getDemoContext();
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: staffUser } = await supabase
      .from("staff_users")
      .select("id, store_id, name, role")
      .eq("id", user.id)
      .single();

    if (!staffUser) return null;

    return {
      userId: staffUser.id,
      storeId: staffUser.store_id,
      role: staffUser.role as StaffRole,
      name: staffUser.name,
    };
  } catch {
    return getDemoContext();
  }
}

/**
 * 認証を必須にする。未認証ならエラーを投げる。
 */
export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    throw new AuthError("認証が必要です", "UNAUTHORIZED");
  }
  return ctx;
}

/**
 * 指定されたrole以上の権限を要求する。
 */
export async function requireRole(
  minimumRole: string
): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (!hasMinimumRole(ctx.role, minimumRole)) {
    throw new AuthError("権限が不足しています", "FORBIDDEN");
  }
  return ctx;
}

/**
 * 対象のstore_idが現在ユーザーのstore_idと一致するか確認。
 */
export function assertStoreAccess(
  ctx: AuthContext,
  targetStoreId: string
): void {
  if (ctx.storeId !== targetStoreId) {
    throw new AuthError("この店舗のデータにはアクセスできません", "FORBIDDEN");
  }
}

/**
 * roleが必要最小ロール以上かチェック
 */
export function hasMinimumRole(
  userRole: string,
  requiredRole: string
): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 99);
}

/**
 * デモモード用のダミーコンテキスト
 */
function getDemoContext(): AuthContext {
  return {
    userId: "00000000-0000-0000-0000-000000000011",
    storeId: "00000000-0000-0000-0000-000000000001",
    role: "owner",
    name: "デモユーザー",
  };
}

/**
 * 認証エラー
 */
export class AuthError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}
