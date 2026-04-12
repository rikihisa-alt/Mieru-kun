import { createClient } from "@/lib/supabase/server";
import type { Visit, VisitWithCustomer } from "@/types/database";
import { DEMO_STORE_ID } from "@/lib/utils";

export async function getActiveVisits(): Promise<VisitWithCustomer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("visits")
    .select("*, customer:customers(*)")
    .eq("store_id", DEMO_STORE_ID)
    .eq("status", "active")
    .order("check_in_at", { ascending: false });
  if (error) throw error;
  return (data as VisitWithCustomer[]) ?? [];
}

export async function getTodayVisits(): Promise<Visit[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("visits")
    .select("*")
    .eq("store_id", DEMO_STORE_ID)
    .gte("check_in_at", `${today}T00:00:00`)
    .order("check_in_at", { ascending: false });
  if (error) throw error;
  return (data as Visit[]) ?? [];
}

export async function getVisitsByCustomer(customerId: string): Promise<Visit[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("visits")
    .select("*")
    .eq("customer_id", customerId)
    .order("check_in_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data as Visit[]) ?? [];
}

export async function createVisit(input: {
  customer_id: string;
  staff_id?: string;
  table_number?: string;
}): Promise<Visit> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("visits")
    .insert({
      store_id: DEMO_STORE_ID,
      customer_id: input.customer_id,
      staff_id: input.staff_id,
      table_number: input.table_number || null,
      check_in_at: new Date().toISOString(),
      status: "active",
    })
    .select()
    .single();
  if (error) throw error;

  // total_visits をインクリメント
  try {
    const { data: customer } = await supabase
      .from("customers")
      .select("total_visits")
      .eq("id", input.customer_id)
      .single();
    if (customer) {
      await supabase
        .from("customers")
        .update({ total_visits: (customer.total_visits || 0) + 1 })
        .eq("id", input.customer_id);
    }
  } catch {
    // エラー時は無視
  }

  return data as Visit;
}

export async function checkoutVisit(
  visitId: string,
  totalAmount: number
): Promise<Visit> {
  const supabase = await createClient();
  const checkOutAt = new Date().toISOString();

  // まず来店情報を取得して滞在時間を計算
  const { data: visit } = await supabase
    .from("visits")
    .select("check_in_at, customer_id")
    .eq("id", visitId)
    .single();

  let stayMinutes = 0;
  if (visit?.check_in_at) {
    stayMinutes = Math.round(
      (new Date(checkOutAt).getTime() - new Date(visit.check_in_at).getTime()) / 60000
    );
  }

  const { data, error } = await supabase
    .from("visits")
    .update({
      check_out_at: checkOutAt,
      status: "settled",
      total_amount: totalAmount,
      stay_minutes: stayMinutes,
    })
    .eq("id", visitId)
    .select()
    .single();
  if (error) throw error;

  // 顧客のtotal_spentを更新
  if (visit?.customer_id) {
    const { data: customer } = await supabase
      .from("customers")
      .select("total_spent")
      .eq("id", visit.customer_id)
      .single();
    if (customer) {
      await supabase
        .from("customers")
        .update({ total_spent: (customer.total_spent || 0) + totalAmount })
        .eq("id", visit.customer_id);
    }
  }

  return data as Visit;
}
