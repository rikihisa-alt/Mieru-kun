"use client";

// =====================================================================
// customers リポジトリ (Supabase専用。呼び出し側で isSupabaseConfigured() を確認すること)
// =====================================================================

import { createClient } from "@/lib/supabase/client";
import { getCurrentStoreId } from "@/lib/supabase/tenant";
import type { CustomerRecord } from "@/lib/store/domain-stores";
import {
  dbCustomerToApp,
  appCustomerToDbInsert,
  appCustomerToDbUpdate,
  type DbCustomerRow,
  type CustomerInsertInput,
} from "./mappers";
import { mirrorCustomers } from "./mirror";

async function fetchAndMirror(): Promise<CustomerRecord[]> {
  const list = await listCustomers();
  mirrorCustomers(list);
  return list;
}

export async function listCustomers(): Promise<CustomerRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("store_id", getCurrentStoreId())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as DbCustomerRow[]).map(dbCustomerToApp);
}

export async function createCustomer(input: CustomerInsertInput): Promise<CustomerRecord> {
  const supabase = createClient();
  const payload = appCustomerToDbInsert(input, getCurrentStoreId());
  const { data, error } = await supabase.from("customers").insert(payload).select("*").single();
  if (error) throw error;
  await fetchAndMirror();
  return dbCustomerToApp(data as DbCustomerRow);
}

export async function updateCustomer(id: string, patch: Partial<CustomerRecord>): Promise<CustomerRecord> {
  const supabase = createClient();
  const payload = appCustomerToDbUpdate(patch);
  const { data, error } = await supabase
    .from("customers")
    .update(payload)
    .eq("id", id)
    .eq("store_id", getCurrentStoreId())
    .select("*")
    .single();
  if (error) throw error;
  await fetchAndMirror();
  return dbCustomerToApp(data as DbCustomerRow);
}

export async function deleteCustomer(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id)
    .eq("store_id", getCurrentStoreId());
  if (error) throw error;
  await fetchAndMirror();
}

/**
 * CSV取込 / ランク一括判定用。
 * id ありの要素は既存顧客への部分更新、id なしの要素は新規作成(name 必須)として扱う。
 */
export type BulkUpsertItem = Partial<CustomerRecord> & { id?: string };

export async function bulkUpsertCustomers(list: BulkUpsertItem[]): Promise<CustomerRecord[]> {
  const supabase = createClient();
  const storeId = getCurrentStoreId();

  for (const item of list) {
    if (item.id) {
      const { id, ...patch } = item;
      const payload = appCustomerToDbUpdate(patch);
      if (Object.keys(payload).length === 0) continue;
      const { error } = await supabase
        .from("customers")
        .update(payload)
        .eq("id", id)
        .eq("store_id", storeId);
      if (error) throw error;
    } else {
      if (!item.name) continue; // 名前必須(呼び出し側でも事前フィルタ済みの想定)
      const payload = appCustomerToDbInsert(item as CustomerInsertInput, storeId);
      const { error } = await supabase.from("customers").insert(payload);
      if (error) throw error;
    }
  }
  return fetchAndMirror();
}
