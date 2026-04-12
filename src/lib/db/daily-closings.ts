import { createClient } from "@/lib/supabase/server";
import type { DailyClosing } from "@/types/database";
import { DEMO_STORE_ID } from "@/lib/utils";

export async function getDailyClosing(date: string): Promise<DailyClosing | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_closings")
    .select("*")
    .eq("store_id", DEMO_STORE_ID)
    .eq("date", date)
    .single();
  if (error) return null;
  return data as DailyClosing;
}

export async function getRecentClosings(limit = 30): Promise<DailyClosing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_closings")
    .select("*")
    .eq("store_id", DEMO_STORE_ID)
    .order("date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as DailyClosing[]) ?? [];
}

export async function createDailyClosing(input: {
  date: string;
  total_sales: number;
  total_cost: number;
  total_visitors: number;
  total_orders: number;
  cash_amount: number;
  card_amount: number;
  electronic_amount: number;
  notes?: string;
  closed_by?: string;
}): Promise<DailyClosing> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_closings")
    .insert({
      store_id: DEMO_STORE_ID,
      ...input,
      closed_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data as DailyClosing;
}
