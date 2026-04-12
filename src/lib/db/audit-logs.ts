import { createClient } from "@/lib/supabase/server";
import type { OperationLog } from "@/types/database";

export async function getAuditLogs(
  storeId: string,
  filters?: {
    action?: string;
    staffId?: string;
    targetTable?: string;
    startDate?: string;
    endDate?: string;
  },
  limit = 100
): Promise<OperationLog[]> {
  const supabase = await createClient();
  let query = supabase
    .from("operation_logs")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters?.action) {
    query = query.eq("action", filters.action);
  }
  if (filters?.staffId) {
    query = query.eq("staff_id", filters.staffId);
  }
  if (filters?.targetTable) {
    query = query.eq("target_type", filters.targetTable);
  }
  if (filters?.startDate) {
    query = query.gte("created_at", `${filters.startDate}T00:00:00`);
  }
  if (filters?.endDate) {
    query = query.lte("created_at", `${filters.endDate}T23:59:59`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as OperationLog[]) ?? [];
}

export async function getAuditActionTypes(storeId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("operation_logs")
    .select("action")
    .eq("store_id", storeId)
    .order("action");
  if (error) return [];
  const unique = new Set((data ?? []).map((d) => d.action));
  return Array.from(unique);
}
