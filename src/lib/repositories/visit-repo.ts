"use client";

// =====================================================================
// visits リポジトリ (Supabase専用。呼び出し側で isSupabaseConfigured() を確認すること)
// =====================================================================

import { createClient } from "@/lib/supabase/client";
import { getCurrentStoreId } from "@/lib/supabase/tenant";
import {
  dbVisitToApp,
  dbVisitToHistory,
  type AppVisit,
  type DbVisitRow,
  type VisitHistoryEntry,
} from "./mappers";
import { mirrorVisits } from "./mirror";

export type { AppVisit as Visit, VisitHistoryEntry };

// customer(name,nickname,rank) を埋め込みselectし、来店中一覧の表示名/ランクを導出する
const VISIT_SELECT = "*, customer:customers(name,nickname,rank)";

async function fetchInStoreAndMirror(): Promise<AppVisit[]> {
  const list = await listInStore();
  mirrorVisits(list);
  return list;
}

/** 来店中(checked_out_at is null)の一覧 */
export async function listInStore(): Promise<AppVisit[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("visits")
    .select(VISIT_SELECT)
    .eq("store_id", getCurrentStoreId())
    .is("checked_out_at", null)
    .order("checked_in_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as DbVisitRow[]).map(dbVisitToApp);
}

export interface CheckInInput {
  /** 顧客紐付けあり=顧客ID、ゲスト=null */
  customerId: string | null;
  /** ゲスト来店時の表示名(customerId=null時のみ使用。顧客紐付け時は customers.nickname/name を使う) */
  name: string;
}

/** 入店。visits へ insert する (status=in_store) */
export async function checkIn(input: CheckInInput): Promise<AppVisit> {
  const supabase = createClient();
  const payload = {
    store_id: getCurrentStoreId(),
    customer_id: input.customerId,
    guest_name: input.customerId ? null : input.name,
    status: "in_store" as const,
    source: "staff" as const,
  };
  const { data, error } = await supabase.from("visits").insert(payload).select(VISIT_SELECT).single();
  if (error) throw error;
  await fetchInStoreAndMirror();
  return dbVisitToApp(data as unknown as DbVisitRow);
}

/** 退店。★削除しない。checked_out_at を更新し status=left にする。 */
export async function checkOut(visitId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("visits")
    .update({ checked_out_at: new Date().toISOString(), status: "left" })
    .eq("id", visitId)
    .eq("store_id", getCurrentStoreId());
  if (error) throw error;
  await fetchInStoreAndMirror();
}

/** 指定顧客の来店履歴(降順) */
export async function listHistoryByCustomer(customerId: string): Promise<VisitHistoryEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("visits")
    .select("*")
    .eq("store_id", getCurrentStoreId())
    .eq("customer_id", customerId)
    .order("checked_in_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as DbVisitRow[]).map(dbVisitToHistory);
}
