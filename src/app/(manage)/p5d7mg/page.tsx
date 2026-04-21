"use client";

import { useState, useEffect, useCallback } from "react";
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

  const loadProducts = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 初回フェッチでDBからデータ取得
    loadProducts();
  }, [loadProducts]);

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

  const activeCount = products.filter(p => p.is_active).length;

  return (
    <div className="page-stack">
      {/* KPI */}
      <section>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="flex items-end gap-8 flex-wrap">
            <KpiItem label="商品" value={products.length} unit="件" />
            <KpiItem label="販売中" value={activeCount} unit="件" />
            <KpiItem label="停止" value={products.length - activeCount} unit="件" />
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            <Plus className="w-3.5 h-3.5" />
            商品を追加
          </button>
        </div>
      </section>

      {/* インラインフォーム */}
      {showForm && (
        <section className="glass-panel">
          <div className="flex items-center justify-between mb-3">
            <p className="t-label">新規商品</p>
            <button onClick={() => setShowForm(false)} className="text-text-tertiary hover:text-text-primary">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] text-text-tertiary font-semibold uppercase tracking-wider mb-1">商品名</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="商品名"
                className="text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-tertiary font-semibold uppercase tracking-wider mb-1">カテゴリ</label>
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
              <label className="block text-[11px] text-text-tertiary font-semibold uppercase tracking-wider mb-1">価格</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0"
                className="text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-tertiary font-semibold uppercase tracking-wider mb-1">原価</label>
              <input
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                placeholder="0"
                className="text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-tertiary font-semibold uppercase tracking-wider mb-1">在庫</label>
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
              className="px-3 py-[7px] bg-accent text-white text-[13px] font-medium rounded-[6px] hover:bg-accent-hover transition-colors"
            >
              追加
            </button>
          </div>
        </section>
      )}

      {/* テーブル */}
      <section className="glass-panel">
        <p className="t-label mb-3">商品一覧</p>
        <table className="data-table">
          <thead>
            <tr>
              <th>商品名</th>
              <th>カテゴリ</th>
              <th>価格</th>
              <th>原価</th>
              <th>在庫</th>
              <th>ステータス</th>
              <th className="px-4 py-2.5 data-th">操作</th>
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
                <tr key={p.id} className="border-b border-border-light hover:bg-bg-hover cursor-pointer transition-colors">
                  <td className="px-4 py-2.5 font-medium">{p.name}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{categoryLabel(p.category)}</td>
                  <td className="px-4 py-2.5 font-medium">{formatCurrency(p.price)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{formatCurrency(p.cost)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{p.stock}</td>
                  <td className="px-4 py-2.5">
                    {p.is_active ? (
                      <span className="chip chip-success">
                        有効
                      </span>
                    ) : (
                      <span className="inline px-1.5 py-0.5 text-[10px] font-semibold rounded-[3px] bg-bg-hover text-text-tertiary">
                        無効
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => toggleActive(p)}
                      className="px-2.5 py-1 text-[12px] text-accent hover:bg-accent-light rounded-[6px] transition-colors"
                    >
                      {p.is_active ? "無効にする" : "有効にする"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function KpiItem({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="t-label">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className="t-value">{value}</span>
        {unit && <span className="text-[14px] text-text-tertiary">{unit}</span>}
      </span>
    </div>
  );
}
