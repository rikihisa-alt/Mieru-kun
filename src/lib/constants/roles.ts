/** ロール定義 */
export const ROLES = {
  admin: { level: 5, label: "管理者", color: "bg-red-100 text-red-700" },
  owner: { level: 4, label: "オーナー", color: "bg-purple-100 text-purple-700" },
  manager: { level: 3, label: "マネージャー", color: "bg-blue-100 text-blue-700" },
  accounting: { level: 2, label: "経理", color: "bg-teal-100 text-teal-700" },
  staff: { level: 1, label: "スタッフ", color: "bg-gray-100 text-gray-700" },
} as const;

export type RoleKey = keyof typeof ROLES;

export const ROLE_OPTIONS = Object.entries(ROLES)
  .filter(([key]) => key !== "admin")
  .map(([value, { label }]) => ({ value, label }));

export function roleLabel(role: string): string {
  return ROLES[role as RoleKey]?.label ?? role;
}

export function roleColor(role: string): string {
  return ROLES[role as RoleKey]?.color ?? "bg-gray-100 text-gray-700";
}
