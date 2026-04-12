import { createClient } from "@/lib/supabase/server";
import { DEMO_STORE_ID } from "@/lib/utils";
import type { DailySummary, ProductSales, CustomerAnalytics } from "@/types/database";

/** 今日のサマリー */
export async function getTodaySummary(): Promise<DailySummary> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const [visitsRes, ordersRes, paymentsRes] = await Promise.all([
    supabase
      .from("visits")
      .select("id, total_amount")
      .eq("store_id", DEMO_STORE_ID)
      .gte("check_in_at", `${today}T00:00:00`),
    supabase
      .from("orders")
      .select("id, total_amount")
      .eq("store_id", DEMO_STORE_ID)
      .eq("status", "confirmed")
      .gte("created_at", `${today}T00:00:00`),
    supabase
      .from("payment_transactions")
      .select("amount")
      .eq("store_id", DEMO_STORE_ID)
      .eq("status", "completed")
      .gte("created_at", `${today}T00:00:00`),
  ]);

  const visits = visitsRes.data ?? [];
  const orders = ordersRes.data ?? [];
  const payments = paymentsRes.data ?? [];

  const totalSales = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalVisitors = visits.length;
  const totalOrders = orders.length;
  const avgSpend = totalVisitors > 0 ? Math.round(totalSales / totalVisitors) : 0;

  return {
    date: today,
    total_sales: totalSales,
    total_visitors: totalVisitors,
    total_orders: totalOrders,
    avg_spend: avgSpend,
  };
}

/** 日別売上推移 (過去N日) */
export async function getDailySales(days = 30): Promise<DailySummary[]> {
  const supabase = await createClient();
  const results: DailySummary[] = [];

  // daily_closingsから取得
  const { data } = await supabase
    .from("daily_closings")
    .select("date, total_sales, total_visitors, total_orders")
    .eq("store_id", DEMO_STORE_ID)
    .order("date", { ascending: false })
    .limit(days);

  for (const row of data ?? []) {
    results.push({
      date: row.date,
      total_sales: row.total_sales || 0,
      total_visitors: row.total_visitors || 0,
      total_orders: row.total_orders || 0,
      avg_spend:
        row.total_visitors > 0
          ? Math.round((row.total_sales || 0) / row.total_visitors)
          : 0,
    });
  }

  return results.reverse();
}

/** 商品別売上 (期間指定) */
export async function getProductSales(
  startDate: string,
  endDate: string
): Promise<ProductSales[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("order_items")
    .select(`
      product_id,
      product_name,
      quantity,
      subtotal,
      order:orders!inner(store_id, status, created_at)
    `)
    .eq("order.store_id", DEMO_STORE_ID)
    .eq("order.status", "confirmed")
    .gte("order.created_at", `${startDate}T00:00:00`)
    .lte("order.created_at", `${endDate}T23:59:59`);

  if (error) return [];

  // 商品ごとに集計
  const map = new Map<string, ProductSales>();
  for (const item of data ?? []) {
    const key = item.product_id || item.product_name;
    const existing = map.get(key);
    if (existing) {
      existing.quantity_sold += item.quantity;
      existing.revenue += item.subtotal;
    } else {
      map.set(key, {
        product_id: item.product_id || "",
        product_name: item.product_name,
        category: "other",
        quantity_sold: item.quantity,
        revenue: item.subtotal,
        cost: 0,
        profit: item.subtotal,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
}

/** 顧客分析 */
export async function getCustomerAnalytics(): Promise<CustomerAnalytics[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, rank, total_visits, total_spent, created_at")
    .eq("store_id", DEMO_STORE_ID)
    .order("total_spent", { ascending: false });

  if (error) return [];

  return (data ?? []).map((c) => ({
    customer_id: c.id,
    customer_name: c.name,
    rank: c.rank,
    visit_count: c.total_visits || 0,
    total_spent: c.total_spent || 0,
    last_visit: null,
    avg_spend:
      c.total_visits > 0
        ? Math.round((c.total_spent || 0) / c.total_visits)
        : 0,
  }));
}

/** 未精算の来店数 */
export async function getUnsettledCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("visits")
    .select("id", { count: "exact", head: true })
    .eq("store_id", DEMO_STORE_ID)
    .eq("status", "active");
  if (error) return 0;
  return count ?? 0;
}
