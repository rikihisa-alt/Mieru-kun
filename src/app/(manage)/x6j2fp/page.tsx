"use client";

import { useState } from "react";
import { CreditCard, Plus, Minus, X, ChevronDown } from "lucide-react";

export type OrderCategory = "entrance" | "drink" | "food" | "tournament_fee" | "tip_purchase" | "tip_use" | "discount" | "adjustment" | "other";

const CATEGORY_LABEL: Record<OrderCategory, string> = {
  entrance: "エントランス",
  drink: "ドリンク",
  food: "フード",
  tournament_fee: "トナメ参加費",
  tip_purchase: "チップ購入",
  tip_use: "チップ利用",
  discount: "割引",
  adjustment: "調整",
  other: "その他",
};

interface CartItem { name: string; price: number; qty: number; category: OrderCategory; }
interface Visit {
  id: string; customer: string; customerNickname: string; rank: string; table: string;
  items: CartItem[]; total: number; status: "active" | "settled"; outstanding?: number;
}

const PRODUCTS: { name: string; price: number; category: OrderCategory }[] = [];

const INIT: Visit[] = [];

export default function OrdersPage() {
  const [visits, setVisits] = useState<Visit[]>(INIT);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "settled">("all");
  const [settleId, setSettleId] = useState<string | null>(null);
  const [settleMethod, setSettleMethod] = useState("cash");
  const [done, setDone] = useState(false);
  const [orderModalId, setOrderModalId] = useState<string | null>(null);

  const filtered = visits.filter(v => filter === "all" || v.status === filter);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  function addToCart(p: typeof PRODUCTS[0]) {
    setCart(prev => {
      const ex = prev.find(i => i.name === p.name);
      if (ex) return prev.map(i => i.name === p.name ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { name: p.name, price: p.price, qty: 1, category: p.category }];
    });
  }
  function updateQty(name: string, d: number) {
    setCart(prev => prev.map(i => i.name === name ? { ...i, qty: Math.max(0, i.qty + d) } : i).filter(i => i.qty > 0));
  }
  function confirmOrder(vid: string) {
    if (!cart.length) return;
    setVisits(prev => prev.map(v => v.id === vid ? { ...v, items: [...v.items, ...cart], total: v.total + cartTotal } : v));
    setCart([]); setOrderModalId(null);
  }
  function settle(id: string) {
    setVisits(prev => prev.map(v => v.id === id ? { ...v, status: "settled" as const } : v));
    setSettleId(null); setDone(true);
    setTimeout(() => setDone(false), 2000);
  }

  return (
    <div className="page-stack">
      {/* フィルタ + 完了トースト */}
      <section>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="tabs">
            {(["all", "active", "settled"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`tab ${filter === f ? "tab-active" : ""}`}>
                {f === "all" ? "すべて" : f === "active" ? "来店中" : "精算済"}
              </button>
            ))}
          </div>
          <span className="ml-auto text-[12px] text-text-tertiary">{filtered.length}件</span>
          {done && <span className="text-[14px] text-[color:var(--success-text)] font-medium toast-in">✓ 精算完了</span>}
        </div>
      </section>

      {/* 一覧（インライン展開付き） */}
      <section className="glass-panel">
        <p className="t-label mb-3">来店セッション</p>
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-8"></th>
              <th>ニックネーム / 本名</th>
              <th>卓</th>
              <th>注文</th>
              <th>金額</th>
              <th>状態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>{filtered.map(v => (
            <React.Fragment key={v.id}>
              <tr onClick={() => setExpandedId(expandedId === v.id ? null : v.id)} className="cursor-pointer">
                <td>
                  <ChevronDown className={`w-3.5 h-3.5 text-text-tertiary transition-transform ${expandedId === v.id ? "rotate-180" : ""}`} />
                </td>
                <td className="font-medium">
                  <div className="flex items-baseline gap-2">
                    <span>{v.customerNickname || v.customer}</span>
                    {v.customerNickname && <span className="text-[12px] text-text-tertiary font-normal">{v.customer}</span>}
                  </div>
                </td>
                <td><span className="chip chip-neutral chip-sm">{v.table}</span></td>
                <td className="text-text-secondary">{v.items.reduce((s, i) => s + i.qty, 0)}点</td>
                <td className="font-medium">¥{v.total.toLocaleString()}</td>
                <td>
                  <span className={`chip chip-sm ${v.status === "active" ? "chip-success" : "chip-neutral"}`}>
                    {v.status === "active" ? "来店中" : "精算済"}
                  </span>
                </td>
                <td>
                  {v.status === "active" && (
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setOrderModalId(v.id); setCart([]); }} className="btn btn-subtle btn-xs">
                        <Plus className="w-3 h-3" />注文
                      </button>
                      <button onClick={() => setSettleId(v.id)} className="btn btn-ghost btn-xs">
                        <CreditCard className="w-3 h-3" />精算
                      </button>
                    </div>
                  )}
                </td>
              </tr>

              {/* インライン展開 */}
              {expandedId === v.id && (
                <tr className="fade-in"><td colSpan={7} className="px-6 py-3 bg-bg-hover border-b border-border-light">
                  {v.items.length === 0 ? (
                    <p className="text-[12px] text-text-tertiary">注文なし</p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-[10px] text-text-tertiary font-semibold uppercase tracking-wider mb-1">注文明細</p>
                      {v.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-[12px]">
                          <span className="text-text-secondary">{item.name} ×{item.qty}</span>
                          <span className="font-medium">¥{(item.price * item.qty).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-[13px] font-bold pt-1 border-t border-border-light mt-1">
                        <span>合計</span><span>¥{v.total.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  {v.status === "active" && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => { setOrderModalId(v.id); setCart([]); }} className="px-3 py-[6px] text-[12px] font-medium text-accent bg-accent-light rounded-[6px] hover:bg-[#d0ebe4]">
                        <Plus className="w-3 h-3 inline mr-1" />注文追加
                      </button>
                      <button onClick={() => setSettleId(v.id)} className="px-3 py-[6px] text-[12px] font-medium text-white bg-accent rounded-[6px] hover:bg-accent-hover">
                        <CreditCard className="w-3 h-3 inline mr-1" />精算する
                      </button>
                    </div>
                  )}
                </td></tr>
              )}
            </React.Fragment>
          ))}</tbody>
        </table>
      </section>

      {/* ===== 注文追加モーダル ===== */}
      {orderModalId && (() => {
        const v = visits.find(x => x.id === orderModalId);
        if (!v) return null;
        return (
          <div className="modal-overlay z-50" onClick={() => setOrderModalId(null)}>
            <div className="bg-white rounded-[8px] w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-border-light">
                <div>
                  <span className="text-[14px] font-semibold">{v.customerNickname || v.customer}</span>
                  {v.customerNickname && <span className="text-[11px] text-text-tertiary ml-2">{v.customer}</span>}
                  <span className="text-[11px] text-text-tertiary ml-2">卓 {v.table}</span>
                </div>
                <button onClick={() => setOrderModalId(null)} className="p-1 hover:bg-bg-hover rounded-[4px]"><X className="w-4 h-4 text-text-tertiary" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(Object.keys(CATEGORY_LABEL) as OrderCategory[]).map((cat) => {
                  const items = PRODUCTS.filter((p) => p.category === cat);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat}>
                      <div className="t-micro text-text-tertiary mb-1">{CATEGORY_LABEL[cat]}</div>
                      <div className="space-y-0.5">
                        {items.map(p => {
                          const inCart = cart.find(c => c.name === p.name);
                          return (
                            <div key={p.name} className="flex items-center justify-between px-2 py-1.5 rounded-[4px] hover:bg-bg-hover cursor-pointer" onClick={() => addToCart(p)}>
                              <div><span className="text-[12px] font-medium">{p.name}</span><span className={`text-[11px] ml-2 ${p.price < 0 ? "text-status-danger" : "text-text-tertiary"}`}>¥{p.price.toLocaleString()}</span></div>
                              {inCart && (
                                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                  <button onClick={() => updateQty(p.name, -1)} className="w-5 h-5 rounded border border-border flex items-center justify-center hover:bg-border-light"><Minus className="w-3 h-3" /></button>
                                  <span className="text-[12px] font-bold w-5 text-center">{inCart.qty}</span>
                                  <button onClick={() => updateQty(p.name, 1)} className="w-5 h-5 rounded border border-border flex items-center justify-center hover:bg-border-light"><Plus className="w-3 h-3" /></button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              {cart.length > 0 && (
                <div className="px-5 py-3 border-t border-border-light space-y-2">
                  <div className="flex justify-between text-[13px]"><span className="text-text-secondary">追加分</span><span className="font-bold">¥{cartTotal.toLocaleString()}</span></div>
                  <button onClick={() => confirmOrder(orderModalId)} className="w-full py-2 bg-accent text-white text-[13px] font-medium rounded-[6px] hover:bg-accent-hover">注文を確定</button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ===== 精算モーダル ===== */}
      {settleId && (() => {
        const v = visits.find(x => x.id === settleId);
        if (!v) return null;
        return (
          <div className="modal-overlay z-50" onClick={() => setSettleId(null)}>
            <div className="bg-white rounded-[8px] w-full max-w-md p-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <SettleModalContent visit={v} method={settleMethod} setMethod={setSettleMethod} onSettle={() => settle(settleId)} onCancel={() => setSettleId(null)} />
            </div>
          </div>
        );
      })()}
    </div>
  );
}

import React from "react";

// ==================== 精算モーダル ====================
type PaymentMethod = "cash" | "card" | "qr" | "tip_offset" | "multike";
const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "現金",
  card: "カード",
  qr: "QR決済",
  tip_offset: "チップ相殺",
  multike: "マルチケ",
};

function SettleModalContent({
  visit, method, setMethod, onSettle, onCancel,
}: {
  visit: Visit;
  method: string;
  setMethod: (m: string) => void;
  onSettle: () => void;
  onCancel: () => void;
}) {
  const [payments, setPayments] = React.useState<{ method: PaymentMethod; amount: number }[]>([
    { method: "cash", amount: visit.total },
  ]);
  const [outstandingAmount, setOutstandingAmount] = React.useState(0);

  const paidTotal = payments.reduce((s, p) => s + p.amount, 0);
  const diff = visit.total - paidTotal - outstandingAmount;

  function addPayment() {
    setPayments((p) => [...p, { method: "cash", amount: Math.max(0, diff) }]);
  }
  function updatePayment(i: number, patch: Partial<{ method: PaymentMethod; amount: number }>) {
    setPayments((p) => p.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function removePayment(i: number) {
    setPayments((p) => p.filter((_, idx) => idx !== i));
  }

  return (
    <>
      <h3 className="text-[14px] font-semibold mb-4">精算</h3>

      <div className="mb-4 p-3 bg-bg-hover rounded-[6px] space-y-1">
        <div className="flex justify-between text-[12px]">
          <span className="text-text-tertiary">顧客</span>
          <span className="font-medium">{visit.customerNickname ? `${visit.customerNickname}（${visit.customer}）` : visit.customer}</span>
        </div>
        <div className="flex justify-between items-end">
          <span className="text-[12px] text-text-tertiary">合計</span>
          <span className="text-[22px] font-bold">¥{visit.total.toLocaleString()}</span>
        </div>
      </div>

      {/* 支払方法（複数） */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] text-text-tertiary font-semibold uppercase tracking-wider">支払方法</label>
          <button onClick={addPayment} className="text-[11px] text-accent hover:underline">+ 支払を追加</button>
        </div>
        <div className="space-y-2">
          {payments.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <select value={p.method} onChange={(e) => { const m = e.target.value as PaymentMethod; updatePayment(i, { method: m }); setMethod(m); }} className="flex-1 text-[13px]">
                {(Object.keys(METHOD_LABEL) as PaymentMethod[]).map((m) => (
                  <option key={m} value={m}>{METHOD_LABEL[m]}</option>
                ))}
              </select>
              <input type="number" value={p.amount} onChange={(e) => updatePayment(i, { amount: parseInt(e.target.value) || 0 })} className="w-28 text-[13px] text-right" />
              {payments.length > 1 && (
                <button onClick={() => removePayment(i)} className="text-status-danger p-1 hover:bg-status-danger-bg rounded">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 未収 */}
      <div className="mb-3">
        <label className="flex items-center gap-2 text-[12px] text-text-secondary cursor-pointer mb-1">
          <input type="checkbox" checked={outstandingAmount > 0} onChange={(e) => setOutstandingAmount(e.target.checked ? Math.max(0, diff) : 0)} />
          <span>未収を計上する</span>
        </label>
        {outstandingAmount > 0 && (
          <input type="number" value={outstandingAmount} onChange={(e) => setOutstandingAmount(parseInt(e.target.value) || 0)} className="w-full text-[13px]" placeholder="未収金額" />
        )}
      </div>

      {/* 差額表示 */}
      <div className={`mb-4 px-3 py-2 rounded-[6px] text-[12px] font-medium flex items-center justify-between ${
        diff === 0 ? "chip chip-success" : diff > 0 ? "chip chip-warning" : "chip chip-danger"
      }`}>
        <span>差額</span>
        <span>{diff === 0 ? "0（精算可能）" : diff > 0 ? `+¥${diff.toLocaleString()}（不足）` : `¥${diff.toLocaleString()}（過払）`}</span>
      </div>

      <div className="flex gap-2">
        <button onClick={onSettle} disabled={diff !== 0} className="flex-1 py-2.5 bg-accent text-white text-[13px] font-medium rounded-[6px] hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed">
          精算を確定
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 border border-border text-[13px] rounded-[6px] hover:bg-bg-hover">
          戻る
        </button>
      </div>
    </>
  );
}
