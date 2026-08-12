"use client";

// =====================================================================
// store_settings リポジトリ (Supabase専用。最小実装)
// 現時点ではどの画面からも呼ばれない基盤コード(将来の店舗設定Supabase移行フェーズ用)。
// =====================================================================

import { createClient } from "@/lib/supabase/client";
import { getCurrentStoreId } from "@/lib/supabase/tenant";

export interface DbStoreSettingsRow {
  store_id: string;
  store_name: string | null;
  display_name: string | null;
  address: string | null;
  phone: string | null;
  open_time: string | null;
  close_time: string | null;
  closed_days: string[] | null;
  ranks: unknown;
  rank_label: string | null;
  chip: unknown;
  point_unit: string | null;
  point_label: string | null;
  point_rewards: unknown;
  entrance: unknown;
  time_charge: unknown;
  rank_rules: unknown;
  fixed_costs: unknown;
  updated_at: string;
}

export async function getStoreSettings(): Promise<DbStoreSettingsRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("store_settings")
    .select("*")
    .eq("store_id", getCurrentStoreId())
    .maybeSingle();
  if (error) throw error;
  return (data as DbStoreSettingsRow | null) ?? null;
}

export async function upsertStoreSettings(
  patch: Partial<Omit<DbStoreSettingsRow, "store_id" | "updated_at">>
): Promise<DbStoreSettingsRow> {
  const supabase = createClient();
  const storeId = getCurrentStoreId();
  const { data, error } = await supabase
    .from("store_settings")
    .upsert({ store_id: storeId, ...patch }, { onConflict: "store_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data as DbStoreSettingsRow;
}
