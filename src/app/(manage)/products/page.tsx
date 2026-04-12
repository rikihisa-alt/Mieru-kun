"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEMO_STORE_ID, formatCurrency, categoryLabel } from "@/lib/utils";
import type { Product } from "@/types/database";
import { Package, Plus, X } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "drink" as string,
    price: "",
    cost: "",
    stock: "",
  });

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
        .order("sort_order", { ascending: true });
      setProducts((data as Product[]) ?? []);
    } catch {
      /* demo */
    }
  }

  async function handleAdd() {
    if (!formData.name || !formData.price) return;
    try {
      const supabase = createClient();
      await supabase.from("products").insert({
        store_id: DEMO_STORE_ID,
        name: formData.name,
        category: formData.category,
        price: Number(formData.price),
        cost: Number(formData.cost) || 0,
        stock: Number(formData.stock) || 0,
        is_active: true,
        sort_order: products.length,
      });
      setFormData({ name: "", category: "drink", price: "", cost: "", stock: "" });
      setShowForm(false);
      await loadProducts();
    } catch {
      /* demo */
    }
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
      /* demo */
    }
  }

  const categories = [
    { value: "drink", label: "ドリンク" },
    { value: "food", label: "フード" },
    { value: "chip", label: "チップ" },
    { value: "other", label: "その他" },
  ];

  return (
    <div className="space-y-4 max-w-5xl">
      {/* ツールバー */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-text-secondary">
          商品数 <strong className="text-text-primary">{products.length}</strong>件
        </span>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-[7px] bg-accent text-text-inverse text-[13px] font-medium rounded-[var(--radius)] hover:bg-accent-hover transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          商品を追加
        </button>
      </div>

      {/* インラインフォーム */}
      {showForm && (
        <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-text-primary">新規商品</h3>
            <button onClick={() => setShowForm(false)} className="text-text-tertiary hover:text-text-primary">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] text-text-tertiary font-medium mb-1">商品名</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="商品名"
                className="text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-tertiary font-medium mb-1">カテゴリ</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="text-[13px]"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-text-tertiary font-medium mb-1">価格</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0"
                className="text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-tertiary font-medium mb-1">原価</label>
              <input
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                placeholder="0"
                className="text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-tertiary font-medium mb-1">在庫</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="0"
                className="text-[13px]"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleAdd}
              className="px-3 py-[7px] bg-accent text-text-inverse text-[13px] font-medium rounded-[var(--radius)] hover:bg-accent-hover transition-colors"
            >
              追加
            </button>
          </div>
        </div>
      )}

      {/* テーブル */}
      <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-bg">
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">商品名</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">カテゴリ</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">価格</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">原価</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">在庫</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">ステータス</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-text-tertiary">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>商品が登録されていません</p>
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-border-light hover:bg-bg-hover transition-colors">
                  <td className="px-4 py-2.5 font-medium">{p.name}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{categoryLabel(p.category)}</td>
                  <td className="px-4 py-2.5 font-medium">{formatCurrency(p.price)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{formatCurrency(p.cost)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{p.stock}</td>
                  <td className="px-4 py-2.5">
                    {p.is_active ? (
                      <span className="inline px-2 py-0.5 text-[11px] font-medium rounded-[var(--radius-sm)] bg-status-success-bg text-status-success">
                        有効
                      </span>
                    ) : (
                      <span className="inline px-2 py-0.5 text-[11px] font-medium rounded-[var(--radius-sm)] bg-bg text-text-tertiary">
                        無効
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => toggleActive(p)}
                      className="px-2.5 py-1 text-[12px] text-accent hover:bg-accent-light rounded-[var(--radius)] transition-colors"
                    >
                      {p.is_active ? "無効にする" : "有効にする"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
