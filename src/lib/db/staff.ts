import { createClient } from "@/lib/supabase/server";
import type { StaffUser, StaffRoleHistory } from "@/types/database";

export async function getStaffList(storeId: string): Promise<StaffUser[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff_users")
    .select("*")
    .eq("store_id", storeId)
    .order("name");
  if (error) throw error;
  return (data as StaffUser[]) ?? [];
}

export async function getStaffById(staffId: string): Promise<StaffUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff_users")
    .select("*")
    .eq("id", staffId)
    .single();
  if (error) return null;
  return data as StaffUser;
}

export async function updateStaffRole(
  staffId: string,
  newRole: string,
  changedBy: string,
  storeId: string,
  reason?: string
): Promise<void> {
  const supabase = await createClient();

  // 現在のroleを取得
  const { data: current } = await supabase
    .from("staff_users")
    .select("role")
    .eq("id", staffId)
    .single();

  // roleを更新
  const { error } = await supabase
    .from("staff_users")
    .update({ role: newRole })
    .eq("id", staffId);
  if (error) throw error;

  // 履歴を記録
  await supabase.from("staff_role_histories").insert({
    store_id: storeId,
    staff_id: staffId,
    from_role: current?.role ?? null,
    to_role: newRole,
    changed_by: changedBy,
    reason: reason ?? null,
  });
}

export async function getStaffRoleHistories(storeId: string): Promise<StaffRoleHistory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff_role_histories")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data as StaffRoleHistory[]) ?? [];
}
