import { createClient } from "@/lib/supabase/server";
import type { PaymentTransaction } from "@/types/database";
import { DEMO_STORE_ID } from "@/lib/utils";

export async function createPayment(input: {
  visit_id: string;
  customer_id?: string;
  amount: number;
  method: "cash" | "card" | "electronic";
}): Promise<PaymentTransaction> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_transactions")
    .insert({
      store_id: DEMO_STORE_ID,
      visit_id: input.visit_id,
      customer_id: input.customer_id || null,
      amount: input.amount,
      method: input.method,
      status: "completed",
    })
    .select()
    .single();
  if (error) throw error;
  return data as PaymentTransaction;
}

export async function getPaymentsByVisit(visitId: string): Promise<PaymentTransaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("visit_id", visitId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as PaymentTransaction[]) ?? [];
}

export async function getTodayPayments(): Promise<PaymentTransaction[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("store_id", DEMO_STORE_ID)
    .gte("created_at", `${today}T00:00:00`);
  if (error) throw error;
  return (data as PaymentTransaction[]) ?? [];
}
