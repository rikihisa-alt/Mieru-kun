import { createClient } from "@/lib/supabase/server";
import type { Order, OrderWithItems } from "@/types/database";
import { DEMO_STORE_ID } from "@/lib/utils";

export async function getOrdersByVisit(visitId: string): Promise<OrderWithItems[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), customer:customers(*)")
    .eq("visit_id", visitId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as OrderWithItems[]) ?? [];
}

export async function getTodayOrders(): Promise<Order[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("store_id", DEMO_STORE_ID)
    .gte("created_at", `${today}T00:00:00`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Order[]) ?? [];
}

export async function createOrder(input: {
  visit_id: string;
  customer_id?: string;
  staff_id?: string;
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }[];
}): Promise<Order> {
  const supabase = await createClient();

  const totalAmount = input.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  // 注文を作成
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      store_id: DEMO_STORE_ID,
      visit_id: input.visit_id,
      customer_id: input.customer_id || null,
      staff_id: input.staff_id || null,
      status: "confirmed",
      total_amount: totalAmount,
    })
    .select()
    .single();
  if (orderError) throw orderError;

  // 注文明細を作成
  const orderItems = input.items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    subtotal: item.quantity * item.unit_price,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);
  if (itemsError) throw itemsError;

  // 来店のtotal_amountを更新
  const { data: existingOrders } = await supabase
    .from("orders")
    .select("total_amount")
    .eq("visit_id", input.visit_id)
    .eq("status", "confirmed");

  const visitTotal = (existingOrders ?? []).reduce(
    (sum, o) => sum + (o.total_amount || 0),
    0
  );

  await supabase
    .from("visits")
    .update({ total_amount: visitTotal })
    .eq("id", input.visit_id);

  return order as Order;
}
