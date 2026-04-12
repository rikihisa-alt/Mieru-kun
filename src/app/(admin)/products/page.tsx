"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/types/database";
import { DEMO_STORE_ID, formatCurrency, categoryLabel } from "@/lib/utils";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const input = {
      store_id: DEMO_STORE_ID,
      name: fd.get("name") as string,
      category: fd.get("category") as string,
      price: parseInt(fd.get("price") as string, 10) || 0,
      cost: parseInt(fd.get("cost") as string, 10) || 0,
      is_active: true,
      sort_order: products.length,
    };

    if (!input.name) {
      setError("商品名は必須です");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: insertError } = await supabase.from("products").insert(input);
      if (insertError) throw insertError;
      setShowModal(false);
      await loadProducts();
    } catch {
      setError("商品の登録に失敗しました");
    }
    setLoading(false);
  }

  async function toggleActive(product: Product) {
    try {
      const supabase = createClient();
      await supabase
        .from("products")
        .update({ is_active: !product.is_active })
        .eq("id", product.id);
      await loadProducts();
    } catch {
      // エラー
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">商品管理</h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" />
          商品を追加
        </Button>
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
              <TableHead>原価</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>操作</TableHead>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{categoryLabel(product.category)}</TableCell>
                  <TableCell>{formatCurrency(product.price)}</TableCell>
                  <TableCell>{formatCurrency(product.cost)}</TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "success" : "default"}>
                      {product.is_active ? "有効" : "無効"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={product.is_active ? "ghost" : "success"}
                      onClick={() => toggleActive(product)}
                    >
                      {product.is_active ? "無効化" : "有効化"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* 商品追加モーダル */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="商品を追加">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input id="name" name="name" label="商品名 *" placeholder="例: ビール" required />
          <Select
            id="category"
            name="category"
            label="カテゴリ"
            options={[
              { value: "drink", label: "ドリンク" },
              { value: "food", label: "フード" },
              { value: "chip", label: "チップ" },
              { value: "other", label: "その他" },
            ]}
          />
          <Input
            id="price"
            name="price"
            label="価格（税込）"
            type="number"
            min={0}
            placeholder="0"
          />
          <Input
            id="cost"
            name="cost"
            label="原価"
            type="number"
            min={0}
            placeholder="0"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "登録中..." : "登録"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              キャンセル
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
