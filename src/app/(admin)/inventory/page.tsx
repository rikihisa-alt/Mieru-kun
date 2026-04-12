"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Warehouse } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/types/database";
import { DEMO_STORE_ID, formatCurrency, categoryLabel } from "@/lib/utils";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", DEMO_STORE_ID)
        .order("sort_order");
      setProducts((data as Product[]) ?? []);
    } catch {
      // Supabase未接続
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Warehouse className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">在庫管理</h1>
          <p className="text-sm text-muted-foreground">
            {products.length}件の商品
          </p>
        </div>
      </div>

      <Card padding={false}>
        {products.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            商品がまだ登録されていません
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableHead>商品名</TableHead>
              <TableHead>カテゴリ</TableHead>
              <TableHead>価格</TableHead>
              <TableHead>在庫数</TableHead>
              <TableHead>ステータス</TableHead>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{categoryLabel(product.category)}</TableCell>
                  <TableCell>{formatCurrency(product.price)}</TableCell>
                  <TableCell>
                    <span
                      className={
                        product.stock < 5
                          ? "text-danger font-semibold"
                          : "text-foreground"
                      }
                    >
                      {product.stock}
                    </span>
                    {product.stock < 5 && (
                      <span className="ml-2 text-xs text-danger">残少</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "success" : "default"}>
                      {product.is_active ? "有効" : "無効"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
