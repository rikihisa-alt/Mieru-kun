import { createClient } from "@/lib/supabase/server";
import type { InventoryLog, Product } from "@/types/database";

export async function getInventoryLogs(
  storeId: string,
  productId?: string,
  limit = 50
): Promise<InventoryLog[]> {
  const supabase = await createClient();
  let query = supabase
    .from("inventory_logs")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (productId) {
    query = query.eq("product_id", productId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as InventoryLog[]) ?? [];
}

export async function getProductsWithStock(storeId: string): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", storeId)
    .order("sort_order");
  if (error) throw error;
  return (data as Product[]) ?? [];
}

export async function adjustInventory(input: {
  storeId: string;
  productId: string;
  change: number;
  reason: string;
}): Promise<InventoryLog> {
  const supabase = await createClient();

  // 現在のstock取得
  const { data: product } = await supabase
    .from("products")
    .select("stock")
    .eq("id", input.productId)
    .single();

  const currentStock = product?.stock ?? 0;
  const newStock = currentStock + input.change;

  // 在庫ログ
  const { data, error } = await supabase
    .from("inventory_logs")
    .insert({
      store_id: input.storeId,
      product_id: input.productId,
      change: input.change,
      stock_after: newStock,
      reason: input.reason,
    })
    .select()
    .single();
  if (error) throw error;

  // products.stockを更新
  await supabase
    .from("products")
    .update({ stock: newStock })
    .eq("id", input.productId);

  return data as InventoryLog;
}
