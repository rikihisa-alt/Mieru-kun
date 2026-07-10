"use client";

import { useMemo, useState } from "react";
import { usePersisted, usePersistedState } from "@/lib/persist/store";
import { productStore, type ProductCategory, type CustomerRank } from "@/lib/store/domain-stores";
import { salesOrderStore, type SalesOrderItem } from "@/lib/v2/stores";
import { Minus, Plus, ShoppingCart, X, Check, Grid3X3 } from "lucide-react";

// 卓マスタ (v2/tables ページが管理する生ストア。ここでは id/name/type のみ参照)
interface TableDef {
  id: string;
  name: string;
  type: "トナメ" | "リング" | "サイド" | "BJ" | "バカラ";
  maxSeats: number;
}

// 来店中リスト (checkin ページ / v2/orders ページと同じキー・型)
interface Visit {
  id: string;
  customerId: string | null;
  name: string;
  rank: CustomerRank;
  checkedInAt: string;
  tableId?: string;
  seatIndex?: number;
}

const CATEGORY_LABEL: Record<ProductCategory, string> = {
  entrance: "エントランス", drink: "ドリンク", food: "フード",
  tournament_fee: "トナメ参加費", tip_purchase: "チップ購入",
  tip_use: "チップ利用", discount: "割引", adjustment: "調整", other: "その他",
};

export default function MobileOrderPage() {
  const [products] = usePersisted(productStore);
  const [, setOrders] = usePersisted(salesOrderStore);
  const [tables] = usePersistedState<TableDef[]>("v2_tables_v2", []);
  const [visits] = usePersistedState<Visit[]>("v2_visits_v1", []);

  // ---- 手順: 卓選択 → 顧客紐付け(任意) → 商品選択 → カート確認 → 送信 ----
  const [tableId, setTableId] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [cat, setCat] = useState<string>("all");
  const [cart, setCart] = useState<SalesOrderItem[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [doneMsg, setDoneMsg] = useState("");

  const selectedTable = tables.find(t => t.id === tableId);
  const tableVisits = useMemo(
    () => tableId ? visits.filter(v => v.tableId === tableId) : [],
    [visits, tableId]
  );

  const activeProducts = useMemo(() => products.filter(p => p.active), [products]);
  const cats = useMemo(
    () => Array.from(new Set(activeProducts.map(p => p.category))) as ProductCategory[],
    [activeProducts]
  );
  const filteredProducts = cat === "all" ? activeProducts : activeProducts.filter(p => p.category === cat);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  function pickTable(id: string) {
    setTableId(id);
    setCustomerId("");
    setCustomerName("");
  }
  function pickCustomer(v: Visit) {
    setCustomerId(v.customerId ?? "");
    setCustomerName(v.name);
  }
  function clearCustomer() {
    setCustomerId("");
    setCustomerName("");
  }
  function addToCart(productId: string) {
    const p = activeProducts.find(x => x.id === productId);
    if (!p) return;
    setCart(prev => {
      const ex = prev.find(i => i.productId === p.id);
      if (ex) return prev.map(i => i.productId === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { productId: p.id, name: p.name, price: p.price, qty: 1, category: p.category }];
    });
  }
  function changeQty(id: string, d: number) {
    setCart(prev => prev.map(i => i.productId === id ? { ...i, qty: Math.max(0, i.qty + d) } : i).filter(i => i.qty > 0));
  }
  function qtyOf(id: string) {
    return cart.find(i => i.productId === id)?.qty ?? 0;
  }

  function submitOrder() {
    if (cart.length === 0 || !selectedTable) return;
    setSending(true);
    setOrders(prev => [{
      id: `o${Date.now()}`,
      customerId: customerId || undefined,
      customer: customerName.trim() || "ゲスト",
      table: selectedTable.name,
      items: cart,
      total: cartTotal,
      status: "active",
      createdAt: new Date().toISOString(),
    }, ...prev]);

    const msg = `卓${selectedTable.name}に注文を送りました`;
    setSending(false);
    setSheetOpen(false);
    setCart([]);
    setCat("all");
    setCustomerId("");
    setCustomerName("");
    setDoneMsg(msg);
    setTimeout(() => setDoneMsg(""), 3000);
  }

  const canSubmit = cart.length > 0 && !!selectedTable;

  return (
    <div className="ln-page" style={{ paddingBottom: cart.length > 0 ? 96 : 32 }}>
      <div className="ln-stack">
        <h1 className="ln-h1" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ShoppingCart size={18} style={{ color: "var(--ln-accent)" }} />モバイル注文
        </h1>

        {doneMsg && (
          <div className="ln-row" style={{ padding: "10px 12px", background: "var(--ln-accent-soft)", borderRadius: "var(--ln-radius-sm)" }}>
            <Check size={14} style={{ color: "var(--ln-accent-text)" }} />
            <span style={{ color: "var(--ln-accent-text)", fontSize: 12, fontWeight: 600 }}>{doneMsg}</span>
          </div>
        )}

        {/* 1. 卓選択 */}
        <div className="ln-card ln-card-compact">
          <div className="ln-card-head" style={{ marginBottom: 8 }}>
            <span className="ln-card-label">卓を選択</span>
            {selectedTable && <span className="ln-chip ln-chip--success">{selectedTable.name}</span>}
          </div>
          {tables.length === 0 ? (
            <p className="ln-mute" style={{ fontSize: 12, margin: 0 }}>卓マスタが未設定です。管理画面(卓管理)で卓を登録してください。</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {tables.map(t => {
                const active = t.id === tableId;
                return (
                  <button
                    key={t.id}
                    onClick={() => pickTable(t.id)}
                    className={`ln-btn ${active ? "ln-btn--selected" : ""}`}
                    style={{ flexDirection: "column", height: 56, gap: 2, padding: "6px 4px" }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.1 }}>{t.name}</span>
                    <span style={{ fontSize: 10, opacity: 0.8 }}>{t.type}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. 顧客紐付け(任意) */}
        {selectedTable && (
          <div className="ln-card ln-card-compact">
            <div className="ln-card-head" style={{ marginBottom: 8 }}>
              <span className="ln-card-label">顧客(任意)</span>
              {customerName && (
                <button onClick={clearCustomer} className="ln-btn ln-btn--ghost ln-btn--sm" style={{ height: 28, padding: "0 8px" }}>
                  <X size={12} />クリア
                </button>
              )}
            </div>
            {tableVisits.length > 0 && (
              <div className="ln-row" style={{ flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {tableVisits.map(v => {
                  const active = customerName === v.name && (v.customerId ?? "") === customerId;
                  return (
                    <button
                      key={v.id}
                      onClick={() => pickCustomer(v)}
                      className={`ln-chip ${active ? "ln-chip--success" : ""}`}
                      style={{ height: 32, padding: "0 12px", fontSize: 12, cursor: "pointer", border: active ? undefined : "1px solid var(--ln-border)" }}
                    >
                      {v.name}
                    </button>
                  );
                })}
              </div>
            )}
            <input
              value={customerName}
              onChange={(e) => { setCustomerName(e.target.value); setCustomerId(""); }}
              placeholder="お名前を入力 (未入力はゲスト扱い)"
            />
          </div>
        )}

        {/* 3. 商品選択 */}
        {selectedTable && (
          <div className="ln-card ln-card-compact">
            <span className="ln-card-label" style={{ display: "block", marginBottom: 8 }}>商品を選択</span>
            {activeProducts.length === 0 ? (
              <p className="ln-mute" style={{ fontSize: 12, margin: 0 }}>商品マスタが空です。管理画面(商品マスタ)で登録してください。</p>
            ) : (
              <>
                <div className="ln-row" style={{ flexWrap: "wrap", gap: 6, marginBottom: 10, overflowX: "auto" }}>
                  <button
                    onClick={() => setCat("all")}
                    className={`ln-chip ${cat === "all" ? "ln-chip--success" : ""}`}
                    style={{ height: 32, padding: "0 12px", fontSize: 12, cursor: "pointer" }}
                  >
                    すべて
                  </button>
                  {cats.map(c => (
                    <button
                      key={c}
                      onClick={() => setCat(c)}
                      className={`ln-chip ${cat === c ? "ln-chip--success" : ""}`}
                      style={{ height: 32, padding: "0 12px", fontSize: 12, cursor: "pointer" }}
                    >
                      {CATEGORY_LABEL[c]}
                    </button>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {filteredProducts.map(p => {
                    const qty = qtyOf(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => addToCart(p.id)}
                        role="button"
                        tabIndex={0}
                        style={{
                          border: `1px solid ${qty > 0 ? "var(--ln-accent)" : "var(--ln-border)"}`,
                          borderRadius: "var(--ln-radius-sm)",
                          background: qty > 0 ? "var(--ln-accent-soft)" : "var(--ln-card)",
                          padding: "10px 12px",
                          minHeight: 68,
                          display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 6,
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.25 }}>{p.name}</span>
                          {qty > 0 && (
                            <span className="ln-num" style={{ fontSize: 12, fontWeight: 700, color: "var(--ln-accent-text)", flexShrink: 0 }}>×{qty}</span>
                          )}
                        </div>
                        <div className="ln-row" style={{ justifyContent: "space-between" }}>
                          <span className="ln-num ln-mute" style={{ fontSize: 12 }}>¥{p.price.toLocaleString()}</span>
                          {qty > 0 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); changeQty(p.id, -1); }}
                              aria-label={`${p.name}を1つ減らす`}
                              style={{
                                width: 28, height: 28, borderRadius: 999,
                                border: "1px solid var(--ln-border)", background: "var(--ln-card)",
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0, color: "var(--ln-text-sub)",
                              }}
                            >
                              <Minus size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {!selectedTable && tables.length > 0 && (
          <div className="ln-empty">
            <Grid3X3 size={20} style={{ color: "var(--ln-text-mute)", marginBottom: 6 }} />
            <div>まず卓を選択してください</div>
          </div>
        )}

        <p className="ln-demo-note">
          ※ 管理画面と同じ端末ブラウザで動作します。別端末との同期はシステム連携の準備中です
        </p>
      </div>

      {/* 下部固定カートバー */}
      {cart.length > 0 && (
        <div
          style={{
            position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 45,
            background: "var(--ln-card)",
            borderTop: "1px solid var(--ln-border-soft)",
            boxShadow: "0 -6px 16px rgba(28, 46, 36, 0.08)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <div style={{ maxWidth: 480, margin: "0 auto", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setSheetOpen(true)}
              className="ln-row"
              style={{ flex: 1, minWidth: 0, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
            >
              <span
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  minWidth: 22, height: 22, borderRadius: 999, padding: "0 6px",
                  background: "var(--ln-accent)", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}
              >
                {cartCount}
              </span>
              <span className="ln-num" style={{ fontSize: 16, fontWeight: 700 }}>¥{cartTotal.toLocaleString()}</span>
              <span className="ln-mute" style={{ fontSize: 11 }}>カートを見る</span>
            </button>
            <button onClick={() => setSheetOpen(true)} className="ln-btn ln-btn--primary" style={{ flexShrink: 0, height: 44, padding: "0 18px" }}>
              確認へ
            </button>
          </div>
        </div>
      )}

      {/* カート確認シート (下からのモーダル風) */}
      {sheetOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(28,46,36,0.35)", display: "flex", alignItems: "flex-end" }}
          onClick={() => setSheetOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 480, margin: "0 auto",
              background: "var(--ln-card)",
              borderTopLeftRadius: "var(--ln-radius-lg)", borderTopRightRadius: "var(--ln-radius-lg)",
              boxShadow: "var(--ln-shadow-lg)",
              maxHeight: "85vh", overflowY: "auto",
              padding: "16px 16px calc(16px + env(safe-area-inset-bottom))",
            }}
          >
            <div className="ln-spread" style={{ marginBottom: 12 }}>
              <span className="ln-h2">注文内容の確認</span>
              <button onClick={() => setSheetOpen(false)} className="ln-btn ln-btn--ghost ln-btn--sm" style={{ height: 32, width: 32, padding: 0 }}>
                <X size={16} />
              </button>
            </div>

            <div className="ln-stack-sm" style={{ marginBottom: 12 }}>
              <div className="ln-spread" style={{ fontSize: 13 }}>
                <span className="ln-mute">卓</span>
                <span style={{ fontWeight: 600 }}>{selectedTable?.name ?? "—"}</span>
              </div>
              <div className="ln-spread" style={{ fontSize: 13 }}>
                <span className="ln-mute">顧客</span>
                <span style={{ fontWeight: 600 }}>{customerName.trim() || "ゲスト"}</span>
              </div>
            </div>

            <div className="ln-list" style={{ marginBottom: 12 }}>
              {cart.map(i => (
                <div key={i.productId} className="ln-list__item" style={{ justifyContent: "space-between" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.name}</div>
                    <div className="ln-mute ln-num" style={{ fontSize: 11 }}>¥{i.price.toLocaleString()} × {i.qty}</div>
                  </div>
                  <div className="ln-row" style={{ flexShrink: 0 }}>
                    <button
                      onClick={() => changeQty(i.productId, -1)}
                      aria-label={`${i.name}を1つ減らす`}
                      style={{ width: 32, height: 32, borderRadius: 999, border: "1px solid var(--ln-border)", background: "var(--ln-card)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="ln-num" style={{ width: 22, textAlign: "center", fontSize: 13, fontWeight: 600 }}>{i.qty}</span>
                    <button
                      onClick={() => changeQty(i.productId, 1)}
                      aria-label={`${i.name}を1つ増やす`}
                      style={{ width: 32, height: 32, borderRadius: 999, border: "1px solid var(--ln-border)", background: "var(--ln-card)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="ln-spread" style={{ marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>合計</span>
              <span className="ln-num" style={{ fontSize: 22, fontWeight: 700 }}>¥{cartTotal.toLocaleString()}</span>
            </div>

            <p className="ln-mute" style={{ fontSize: 11, marginBottom: 12 }}>
              ※ この操作では注文の送信のみ行います。精算(会計)は管理画面または精算画面で行ってください。
            </p>

            <button
              onClick={submitOrder}
              disabled={!canSubmit || sending}
              className="ln-btn ln-btn--primary ln-btn--full ln-btn--lg"
              style={{ opacity: !canSubmit || sending ? 0.5 : 1 }}
            >
              <Check size={16} />
              注文を送信
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
