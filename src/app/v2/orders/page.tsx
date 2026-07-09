"use client";

import { useState, useMemo } from "react";
import { usePersisted } from "@/lib/persist/store";
import { productStore, customerStore } from "@/lib/store/domain-stores";
import { salesOrderStore, type SalesOrder, type SalesOrderItem, stockMovementStore } from "@/lib/v2/stores";
import { PageHeader, Btn, Panel, Modal, VStack, HStack, Chip, Empty, Field } from "@/components/v2/ui";
import { Plus, Minus, CreditCard, Trash2, X, FileDown } from "lucide-react";
import { printDoc, tableHtml, kpisHtml } from "@/lib/v2/pdf";

export default function OrdersPage() {
  const [products, setProducts] = usePersisted(productStore);
  const [customers, setCustomers] = usePersisted(customerStore);
  const [orders, setOrders] = usePersisted(salesOrderStore);
  const [, setMovements] = usePersisted(stockMovementStore);
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState<string>("");
  const [customer, setCustomer] = useState("");
  const [table, setTable] = useState("");
  const [cart, setCart] = useState<SalesOrderItem[]>([]);
  const [settling, setSettling] = useState<SalesOrder | null>(null);
  const [method, setMethod] = useState<"cash" | "card" | "qr" | "credit">("cash");
  const [cat, setCat] = useState<string>("all");

  const active = orders.filter(o => o.status === "active");
  const settled = orders.filter(o => o.status === "settled");
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const activeProducts = useMemo(() => products.filter(p => p.active), [products]);
  const cats = useMemo(() => Array.from(new Set(activeProducts.map(p => p.category))), [activeProducts]);
  const filteredProducts = cat === "all" ? activeProducts : activeProducts.filter(p => p.category === cat);

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
  function pickCustomer(id: string) {
    setCustomerId(id);
    if (id) {
      const c = customers.find(x => x.id === id);
      if (c) setCustomer(c.nickname || c.name);
    } else {
      setCustomer("");
    }
  }
  function createOrder() {
    if (!customer.trim() || cart.length === 0) return;
    setOrders(prev => [{
      id: `o${Date.now()}`,
      customerId: customerId || undefined,
      customer: customer.trim(), table: table.trim() || undefined,
      items: cart, total: cartTotal,
      status: "active", createdAt: new Date().toISOString(),
    }, ...prev]);
    setOpen(false);
    resetForm();
  }
  function resetForm() {
    setCustomer(""); setCustomerId(""); setTable(""); setCart([]); setCat("all");
  }
  function openSettle(o: SalesOrder) { setSettling(o); setMethod("cash"); }
  function settle() {
    if (!settling) return;
    const s = settling;
    const isCredit = method === "credit";
    // 1. 注文ステータス
    setOrders(prev => prev.map(o => o.id === s.id ? {
      ...o,
      status: "settled" as const,
      settledAt: new Date().toISOString(),
      paymentMethod: method,
      ...(isCredit ? { unpaid: true } : {}),
    } : o));
    // 2. 在庫減算 + 在庫移動履歴
    const now = new Date().toISOString();
    setProducts(prev => prev.map(p => {
      const item = s.items.find(i => i.productId === p.id);
      if (!item || p.stock == null) return p;
      const newStock = Math.max(0, p.stock - item.qty);
      return { ...p, stock: newStock };
    }));
    setMovements(prev => {
      const next = [...prev];
      s.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        if (!prod || prod.stock == null) return;
        next.unshift({
          id: `m${Date.now()}_${item.productId}`,
          productId: item.productId, productName: item.name,
          delta: -item.qty, reason: "sold",
          reasonNote: `${s.customer} (${s.id})`,
          balanceAfter: Math.max(0, prod.stock - item.qty),
          createdAt: now,
        });
      });
      return next;
    });
    // 3. 顧客の累計利用額/来店回数を加算
    if (s.customerId) {
      setCustomers(prev => prev.map(c => c.id === s.customerId
        ? { ...c, totalSpent: c.totalSpent + s.total, totalVisits: c.totalVisits + 1, lastVisit: now.slice(0, 10).replace(/-/g, "/") }
        : c
      ));
    }
    setSettling(null);
  }
  function remove(id: string) {
    if (!confirm("削除しますか？")) return;
    setOrders(prev => prev.filter(o => o.id !== id));
  }

  function paymentLabel(m?: string) {
    return m === "cash" ? "現金" : m === "card" ? "カード" : m === "qr" ? "QR" : m === "credit" ? "後払い" : "—";
  }

  function receipt(o: SalesOrder) {
    const body = kpisHtml([
      { label: "顧客", value: o.customer },
      { label: "卓", value: o.table ?? "—" },
      { label: "支払", value: paymentLabel(o.paymentMethod) },
      { label: "時刻", value: new Date(o.settledAt ?? o.createdAt).toLocaleString("ja-JP") },
    ]) + tableHtml(["商品", "数量", "単価", "小計"],
      o.items.map(i => [i.name, String(i.qty), `¥${i.price.toLocaleString()}`, `¥${(i.price * i.qty).toLocaleString()}`]),
      { numCols: [1, 2, 3] }) + `<h2 class="pdf-h2">合計</h2><div style="text-align:right;font-size:22px;font-weight:700">¥${o.total.toLocaleString()}</div>`;
    printDoc({ title: "レシート", subtitle: o.id, body });
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
        <Panel title="精算済み (本日)" action={<span className="v2-mute" style={{ fontSize: 12 }}>{settled.length}件</span>}>
          <table className="v2-table">
            <thead><tr><th>顧客</th><th>商品</th><th className="v2-num-cell">合計</th><th>支払</th><th>時刻</th><th></th></tr></thead>
            <tbody>
              {settled.slice(0, 20).map(o => (
                <tr key={o.id}>
                  <td>{o.customer}</td>
                  <td className="v2-sub" style={{ fontSize: 12 }}>{o.items.map(i => `${i.name}×${i.qty}`).join(" / ")}</td>
                  <td className="v2-num-cell">¥{o.total.toLocaleString()}</td>
                  <td className="v2-sub">
                    {o.paymentMethod === "credit"
                      ? <Chip variant={o.unpaid ? "warn" : "success"}>{o.unpaid ? "後払い(未払)" : "後払い(消込済)"}</Chip>
                      : paymentLabel(o.paymentMethod)}
                  </td>
                  <td className="v2-num v2-sub">{new Date(o.settledAt ?? o.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</td>
                  <td><Btn size="xs" onClick={() => receipt(o)}><FileDown size={11}/> 領収</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {/* 新規注文 */}
      <Modal
        open={open}
        onClose={() => { setOpen(false); resetForm(); }}
        title="新規注文"
        size="lg"
        footer={<><Btn onClick={() => { setOpen(false); resetForm(); }}>キャンセル</Btn><Btn variant="primary" onClick={createOrder} disabled={!customer.trim() || cart.length === 0}>注文確定 ¥{cartTotal.toLocaleString()}</Btn></>}
      >
        <VStack gap={16}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="既存顧客">
              <select value={customerId} onChange={(e) => pickCustomer(e.target.value)}>
                <option value="">— ゲスト —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.nickname || c.name}</option>)}
              </select>
            </Field>
            <Field label="顧客名 / ゲスト名" required><input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="お名前" /></Field>
            <Field label="卓"><input value={table} onChange={(e) => setTable(e.target.value)} placeholder="A-1" /></Field>
          </div>

          {activeProducts.length === 0 ? (
            <div className="v2-mute" style={{ fontSize: 12, padding: 8 }}>商品マスタが空です。先に <a href="/v2/products" style={{ textDecoration: "underline" }}>商品マスタ</a> で商品を登録してください。</div>
          ) : (
            <div>
              <HStack gap={6} style={{ flexWrap: "wrap", marginBottom: 8 }}>
                <button onClick={() => setCat("all")} className={`v2-btn ${cat === "all" ? "v2-btn-primary" : ""}`} style={{ height: 26, padding: "0 10px", fontSize: 12 }}>すべて</button>
                {cats.map(c => (
                  <button key={c} onClick={() => setCat(c)} className={`v2-btn ${cat === c ? "v2-btn-primary" : ""}`} style={{ height: 26, padding: "0 10px", fontSize: 12 }}>{c}</button>
                ))}
              </HStack>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 6 }}>
                {filteredProducts.map(p => (
                  <button key={p.id} onClick={() => addToCart(p.id)} className="v2-btn" style={{ height: 56, flexDirection: "column", padding: 8, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 12 }}>{p.name}</span>
                    <HStack gap={4} style={{ width: "100%" }}>
                      <span className="v2-num v2-mute" style={{ fontSize: 11 }}>¥{p.price.toLocaleString()}</span>
                      {p.stock != null && <span className="v2-mute" style={{ fontSize: 10, marginLeft: "auto" }}>在 {p.stock}</span>}
                    </HStack>
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

      {/* 精算 */}
      <Modal
        open={!!settling}
        onClose={() => setSettling(null)}
        title="精算"
        footer={<><Btn onClick={() => setSettling(null)}>キャンセル</Btn><Btn variant="primary" onClick={settle}>{method === "credit" ? "後払いで確定" : "精算する"}</Btn></>}
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                {(["cash", "card", "qr", "credit"] as const).map(m => (
                  <button key={m} onClick={() => setMethod(m)} className={`v2-btn ${method === m ? "v2-btn-primary" : ""}`}>
                    {m === "cash" ? "現金" : m === "card" ? "カード" : m === "qr" ? "QR" : "後払い"}
                  </button>
                ))}
              </div>
            </Field>
            {method === "credit" && !settling.customerId && (
              <div style={{ padding: 10, background: "var(--v2-warn-bg)", color: "var(--v2-warn)", fontSize: 12, borderRadius: 3 }}>
                この注文は既存顧客に紐付いていません(ゲスト名: {settling.customer})。後日の消し込みのため、可能であれば顧客登録して紐付けてください。
              </div>
            )}
            {method === "credit" && (
              <div className="v2-mute" style={{ fontSize: 11 }}>※ 後払いは売掛金として扱われ、現金/カード/QRの売上には計上されません。未払いリスト(売上管理 &gt; 未払い)で管理し、入金時に消し込んでください。</div>
            )}
            {settling.customerId && (
              <div className="v2-mute" style={{ fontSize: 11 }}>※ 精算後、顧客の累計利用額 / 来店回数を自動で加算します</div>
            )}
          </VStack>
        )}
      </Modal>
    </VStack>
  );
}
