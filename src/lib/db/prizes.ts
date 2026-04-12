import { createClient } from "@/lib/supabase/server";
import type { PrizeMaster, PrizeLog } from "@/types/database";

export async function getPrizeMasters(storeId: string): Promise<PrizeMaster[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prize_masters")
    .select("*")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return (data as PrizeMaster[]) ?? [];
}

export async function getPrizeLogs(storeId: string, customerId?: string): Promise<PrizeLog[]> {
  const supabase = await createClient();
  let query = supabase
    .from("prize_logs")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (customerId) {
    query = query.eq("customer_id", customerId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data as PrizeLog[]) ?? [];
}

export async function grantPrize(input: {
  storeId: string;
  customerId: string;
  prizeMasterId: string;
  prizeName: string;
  pointsUsed: number;
  staffId: string;
}): Promise<PrizeLog> {
  const supabase = await createClient();

  // プライズログを作成
  const { data, error } = await supabase
    .from("prize_logs")
    .insert({
      store_id: input.storeId,
      customer_id: input.customerId,
      prize_master_id: input.prizeMasterId,
      prize_name: input.prizeName,
      points_used: input.pointsUsed,
      status: "granted",
    })
    .select()
    .single();
  if (error) throw error;

  // ポイント差し引き
  if (input.pointsUsed > 0) {
    const { data: customer } = await supabase
      .from("customers")
      .select("point_balance")
      .eq("id", input.customerId)
      .single();

    const newBalance = (customer?.point_balance ?? 0) - input.pointsUsed;

    await supabase.from("point_logs").insert({
      store_id: input.storeId,
      customer_id: input.customerId,
      change: -input.pointsUsed,
      balance_after: newBalance,
      reason: `プライズ交換: ${input.prizeName}`,
    });

    await supabase
      .from("customers")
      .update({ point_balance: newBalance })
      .eq("id", input.customerId);
  }

  // プライズ在庫減算
  try {
    const { data: prizeMaster } = await supabase
      .from("prize_masters")
      .select("stock")
      .eq("id", input.prizeMasterId)
      .single();
    if (prizeMaster) {
      await supabase
        .from("prize_masters")
        .update({ stock: Math.max(0, (prizeMaster.stock || 0) - 1) })
        .eq("id", input.prizeMasterId);
    }
  } catch {
    // エラー時は無視
  }

  return data as PrizeLog;
}
