"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Minus, CheckCircle } from "lucide-react";
import { createOrderAction } from "@/lib/actions/order-actions";
import { createClient } from "@/lib/supabase/client";
import type { VisitWithCustomer, Product } from "@/types/database";
import {
  DEMO_STORE_ID,
  formatCurrency,
  formatTime,
  categoryLabel,
} from "@/lib/utils";

interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export default function OrdersPage() {
  const [visits, setVisits] = useState<VisitWithCustomer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<VisitWithCustomer | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const supabase = createClient();
      const [visitsRes, productsRes] = await Promise.all([
        supabase
          .from("visits")
          .select("*, customer:customers(*)")
          .eq("store_id", DEMO_STORE_ID)
          .eq("status", "active")
          .order("check_in_at", { ascending: false }),
        supabase
          .from("products")
          .select("*")
          .eq("store_id", DEMO_STORE_ID)
          .eq("is_active", true)
          .order("sort_order"),
      ]);
      setVisits((visitsRes.data as VisitWithCustomer[]) ?? []);
      setProducts((productsRes.data as Product[]) ?? []);
    } catch {
      // Supabase未接続
    }
  }

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_price: product.price,
        },
      ];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product_id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  const categories = ["all", ...new Set(products.map((p) => p.category))];
  const filteredProducts =
    activeCategory === "all"
      ? products
      : products.filter((p) => p.category === activeCategory);

  async function handleOrder() {
    if (!selectedVisit || cart.length === 0) return;
    setLoading(true);
    setMessage("");

    const result = await createOrderAction({
      visit_id: selectedVisit.id,
      customer_id: selectedVisit.customer_id,
      items: cart,
    });

    if (result.error) {
      setMessage(result.error);
    } else {
      setSuccess(true);
      setMessage("注文を登録しました");
      setTimeout(() => {
        setCart([]);
        setSelectedVisit(null);
        setSuccess(false);
        setMessage("");
        loadData();
      }, 2000);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-bold">注文登録</h1>
        <Card className="text-center py-10">
          <CheckCircle className="w-12 h-12 mx-auto text-success mb-3" />
          <p className="text-lg font-medium text-success">{message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">注文登録</h1>

      {!selectedVisit ? (
        /* Step 1: 来店中顧客を選択 */
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">来店中のお客様を選択</p>
          {visits.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                来店中のお客様はいません
              </p>
            </Card>
          ) : (
            visits.map((visit) => (
              <Card
                key={visit.id}
                className="cursor-pointer hover:bg-muted/30 active:bg-muted/50 transition-colors"
                onClick={() => setSelectedVisit(visit)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{visit.customer?.name}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(visit.check_in_at)}〜
                      {visit.table_number && ` | 卓 ${visit.table_number}`}
                    </span>
                  </div>
                  <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* Step 2: 商品選択 */
        <div className="space-y-3">
          <Card className="flex items-center justify-between !py-3">
            <div>
              <p className="text-sm font-medium">{selectedVisit.customer?.name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedVisit.table_number && `卓 ${selectedVisit.table_number}`}
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => { setSelectedVisit(null); setCart([]); }}>
              変更
            </Button>
          </Card>

          {/* カテゴリタブ */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-white"
                    : "bg-white border border-border text-muted-foreground"
                }`}
              >
                {cat === "all" ? "すべて" : categoryLabel(cat)}
              </button>
            ))}
          </div>

          {/* 商品グリッド */}
          <div className="grid grid-cols-2 gap-2">
            {filteredProducts.map((product) => {
              const inCart = cart.find((c) => c.product_id === product.id);
              return (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:bg-muted/30 active:bg-muted/50 transition-colors relative"
                  onClick={() => addToCart(product)}
                >
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-sm font-bold text-primary mt-1">
                    {formatCurrency(product.price)}
                  </p>
                  {inCart && (
                    <Badge variant="info" className="absolute top-2 right-2">
                      {inCart.quantity}
                    </Badge>
                  )}
                </Card>
              );
            })}
          </div>

          {/* カート */}
          {cart.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold mb-2">注文内容</h3>
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.product_id} className="flex items-center justify-between text-sm">
                    <span className="flex-1 truncate">{item.product_name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); updateQuantity(item.product_id, -1); }}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); updateQuantity(item.product_id, 1); }}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="w-16 text-right font-medium">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-2 mt-2">
                  <span className="font-semibold">合計</span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {message && <p className="text-sm text-danger">{message}</p>}

          <Button
            size="lg"
            className="w-full py-4 text-base"
            onClick={handleOrder}
            disabled={loading || cart.length === 0}
          >
            {loading ? "注文中..." : `注文を確定する (${formatCurrency(cartTotal)})`}
          </Button>
        </div>
      )}
    </div>
  );
}
