import { createClient } from "@/lib/supabase/server";
import type { StoreSetting, Store } from "@/types/database";

export async function getStoreSettings(storeId: string): Promise<StoreSetting[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_settings")
    .select("*")
    .eq("store_id", storeId);
  if (error) throw error;
  return (data as StoreSetting[]) ?? [];
}

export async function getStoreSetting(storeId: string, key: string): Promise<StoreSetting | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_settings")
    .select("*")
    .eq("store_id", storeId)
    .eq("key", key)
    .single();
  if (error) return null;
  return data as StoreSetting;
}

export async function upsertStoreSetting(
  storeId: string,
  key: string,
  value: Record<string, unknown>
): Promise<StoreSetting> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_settings")
    .upsert(
      { store_id: storeId, key, value, updated_at: new Date().toISOString() },
      { onConflict: "store_id,key" }
    )
    .select()
    .single();
  if (error) throw error;
  return data as StoreSetting;
}

export async function getStoreInfo(storeId: string): Promise<Store | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", storeId)
    .single();
  if (error) return null;
  return data as Store;
}

export async function updateStoreInfo(storeId: string, input: Partial<Store>): Promise<Store> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stores")
    .update(input)
    .eq("id", storeId)
    .select()
    .single();
  if (error) throw error;
  return data as Store;
}
