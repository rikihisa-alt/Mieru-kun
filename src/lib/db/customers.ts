import { createClient } from "@/lib/supabase/server";
import type { Customer } from "@/types/database";
import { DEMO_STORE_ID } from "@/lib/utils";

export async function getCustomers(search?: string): Promise<Customer[]> {
  const supabase = await createClient();
  let query = supabase
    .from("customers")
    .select("*")
    .eq("store_id", DEMO_STORE_ID)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Customer[]) ?? [];
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Customer;
}

export async function createCustomer(
  input: Omit<Customer, "id" | "store_id" | "created_at" | "total_visits" | "total_spent" | "chip_balance" | "point_balance" | "last_visit_at" | "birthday" | "gender">
): Promise<Customer> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .insert({ ...input, store_id: DEMO_STORE_ID })
    .select()
    .single();
  if (error) throw error;
  return data as Customer;
}

export async function updateCustomer(
  id: string,
  input: Partial<Customer>
): Promise<Customer> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Customer;
}
