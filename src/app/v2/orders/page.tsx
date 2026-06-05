"use client";

import { useState } from "react";
import { usePersisted, usePersistedState } from "@/lib/persist/store";
import { productStore } from "@/lib/store/domain-stores";
import { PageHeader, Btn, Panel, Modal, VStack, HStack, Chip, Empty, Field } from "@/components/v2/ui";
import { Plus, Minus, CreditCard, Trash2, X } from "lucide-react";

interface CartItem { productId: string; name: string; price: number; qty: number; }
interface Order {
  id: string;
  customer: string;
  table?: string;
  items: CartItem[];
  total: number;
  status: "active" | "settled";
  createdAt: string;
  settledAt?: string;
  paymentMethod?: "cash" | "card" | "qr";
}

export default function OrdersPage() {
  const [products] = usePersisted(productStore);
  const [orders, setOrders] = usePersistedState<Order[]>("v2_orders_v1", []);
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState("");
  const [table, setTable] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [settling, setSettling] = useState<Order | null>(null);
  const [method, setMethod] = useState<"cash" | "card" | "qr">("cash");

  const active = orders.filter(o => o.status === "active");
  const settled = orders.filter(o => o.status === "settled");
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const activeProducts = products.filter(p => p.active);

  function addToCart(productId: string) {
    const p = activeProducts.find(x => x.id === productId);
    if (!p) return;
    setCart(prev => {
      const ex = prev.find(i => i.productId === p.id);
      if (ex) return prev.map(i => i.productId === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { productId: p.id, name: p.name, price: p.price, qty: 1 }];
    });
  }
  function changeQty(id: string, d: number) {
    setCart(prev => prev.map(i => i.productId === id ? { ...i, qty: Math.max(0, i.qty + d) } : i).filter(i => i.qty > 0));
  }
  function createOrder() {
    if (!customer.trim() || cart.length === 0) return;
    setOrders(prev => [{
      id: `o${Date.now()}`,
      customer: customer.trim(), table: table.trim() || undefined,
      items: cart, total: cartTotal,
      status: "active", createdAt: new Date().toISOString(),
    }, ...prev]);
    setOpen(false);
    setCustomer(""); setTable(""); setCart([]);
  }
  function openSettle(o: Order) { setSettling(o); setMethod("cash"); }
  function settle() {
    if (!settling) return;
    setOrders(prev => prev.map(o => o.id === settling.id ? { ...o, status: "settled" as const, settledAt: new Date().toISOString(), paymentMethod: method } : o));
    setSettling(null);
  }
  function remove(id: string) {
    if (!confirm("削除しますか？")) return;
    setOrders(prev => prev.filter(o => o.id !== id));
  }

  return (
    <VStack gap={16}>
      <PageHeader
        title="注文・精算"
        sub={`未精算 ${active.length} · 精算済 ${settled.length}`}
        action={<Btn variant="primary" onClick={() => setOpen(true)}><Plus size={14} /> 新規注文</Btn>}
      />

      <Panel title="未精算">
        {active.length === 0 ? <Empty>未精算の注文はありません</Empty> : (
          <table className="v2-table">
            <thead><tr><th>顧客</th><th>卓</th><th>商品</th><th className="v2-num-cell">合計</th><th>時刻</th><th></th></tr></thead>
            <tbody>
              {active.map(o => (
                <tr key={o.id}>
                  <td>{o.customer}</td>
                  <td>{o.table ? <Chip>{o.table}</Chip> : <span className="v2-mute">—</span>}</td>
                  <td className="v2-sub" style={{ fontSize: 12 }}>{o.items.map(i => `${i.name}×${i.qty}`).join(" / ")}</td>
                  <td className="v2-num-cell">¥{o.total.toLocaleString()}</td>
                  <td className="v2-num v2-sub">{new Date(o.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</td>
                  <td>
                    <HStack gap={4}>
                      <Btn size="xs" onClick={() => openSettle(o)}><CreditCard size={11} /> 精算</Btn>
                      <Btn size="xs" variant="danger" onClick={() => remove(o.id)}><Trash2 size={11} /></Btn>
                    </HStack>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      {settled.length > 0 && (
        <Panel title="精算済み" action={<span className="v2-mute" style={{ fontSize: 12 }}>{settled.length}件</span>}>
          <table className="v2-table">
            <thead><tr><th>顧客</th><th>商品</th><th className="v2-num-cell">合計</th><th>支払</th><th>時刻</th></tr></thead>
            <tbody>
              {settled.slice(0, 20).map(o => (
                <tr key={o.id}>
                  <td>{o.customer}</td>
                  <td className="v2-sub" style={{ fontSize: 12 }}>{o.items.map(i => `${i.name}×${i.qty}`).join(" / ")}</td>
                  <td className="v2-num-cell">¥{o.total.toLocaleString()}</td>
                  <td className="v2-sub">{o.paymentMethod === "cash" ? "現金" : o.paymentMethod === "card" ? "カード" : "QR"}</td>
                  <td className="v2-num v2-sub">{new Date(o.settledAt ?? o.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {/* 新規注文モーダル */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="新規注文"
        size="lg"
        footer={<><Btn onClick={() => setOpen(false)}>キャンセル</Btn><Btn variant="primary" onClick={createOrder} disabled={!customer.trim() || cart.length === 0}>注文確定 ¥{cartTotal.toLocaleString()}</Btn></>}
      >
        <VStack gap={16}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="顧客" required><input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="お名前" /></Field>
            <Field label="卓 (任意)"><input value={table} onChange={(e) => setTable(e.target.value)} placeholder="A-1" /></Field>
          </div>

          {activeProducts.length === 0 ? (
            <div className="v2-mute" style={{ fontSize: 12, padding: 8 }}>商品マスタが空です。先に <a href="/v2/products" style={{ textDecoration: "underline" }}>商品マスタ</a> で商品を登録してください。</div>
          ) : (
            <div>
              <div className="v2-label" style={{ marginBottom: 6 }}>商品</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 6 }}>
                {activeProducts.map(p => (
                  <button key={p.id} onClick={() => addToCart(p.id)} className="v2-btn" style={{ height: 56, flexDirection: "column", padding: 8, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 12 }}>{p.name}</span>
                    <span className="v2-num v2-mute" style={{ fontSize: 11 }}>¥{p.price.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {cart.length > 0 && (
            <div>
              <div className="v2-label" style={{ marginBottom: 6 }}>カート</div>
              <table className="v2-table">
                <tbody>
                  {cart.map(i => (
                    <tr key={i.productId}>
                      <td>{i.name}</td>
                      <td className="v2-num-cell" style={{ width: 80 }}>¥{i.price.toLocaleString()}</td>
                      <td style={{ width: 100 }}>
                        <HStack gap={4}>
                          <Btn size="xs" onClick={() => changeQty(i.productId, -1)}><Minus size={11} /></Btn>
                          <span style={{ width: 24, textAlign: "center", fontFamily: "var(--v2-num)" }}>{i.qty}</span>
                          <Btn size="xs" onClick={() => changeQty(i.productId, 1)}><Plus size={11} /></Btn>
                        </HStack>
                      </td>
                      <td className="v2-num-cell" style={{ width: 90 }}>¥{(i.price * i.qty).toLocaleString()}</td>
                      <td style={{ width: 28 }}><Btn size="xs" variant="ghost" onClick={() => changeQty(i.productId, -i.qty)}><X size={11} /></Btn></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td colSpan={3} className="v2-mute" style={{ paddingTop: 8 }}>合計</td><td className="v2-num-cell" style={{ paddingTop: 8, fontSize: 16, fontWeight: 600 }}>¥{cartTotal.toLocaleString()}</td><td></td></tr>
                </tfoot>
              </table>
            </div>
          )}
        </VStack>
      </Modal>

      {/* 精算モーダル */}
      <Modal
        open={!!settling}
        onClose={() => setSettling(null)}
        title="精算"
        footer={<><Btn onClick={() => setSettling(null)}>キャンセル</Btn><Btn variant="primary" onClick={settle}>精算する</Btn></>}
      >
        {settling && (
          <VStack gap={16}>
            <div>
              <div className="v2-mute" style={{ fontSize: 12 }}>顧客</div>
              <div style={{ fontSize: 16 }}>{settling.customer}</div>
            </div>
            <div>
              <div className="v2-mute" style={{ fontSize: 12 }}>金額</div>
              <div className="v2-num" style={{ fontSize: 28, fontWeight: 600 }}>¥{settling.total.toLocaleString()}</div>
            </div>
            <Field label="支払方法">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                {(["cash", "card", "qr"] as const).map(m => (
                  <button key={m} onClick={() => setMethod(m)} className={`v2-btn ${method === m ? "v2-btn-primary" : ""}`}>
                    {m === "cash" ? "現金" : m === "card" ? "カード" : "QR"}
                  </button>
                ))}
              </div>
            </Field>
          </VStack>
        )}
      </Modal>
    </VStack>
  );
}
