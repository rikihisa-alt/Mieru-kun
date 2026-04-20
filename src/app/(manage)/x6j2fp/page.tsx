"use client";

import Image from "next/image";
import { useState } from "react";
import { ShoppingBag, CreditCard, Plus, Minus, CheckCircle, X, ChevronDown } from "lucide-react";

interface CartItem { name: string; price: number; qty: number; }
interface Visit {
  id: string; customer: string; customerNickname: string; rank: string; table: string;
  items: CartItem[]; total: number; status: "active" | "settled";
}

const PRODUCTS = [
  { name: "ビール", price: 600 }, { name: "ハイボール", price: 500 },
  { name: "ソフトドリンク", price: 300 }, { name: "ウイスキー", price: 800 },
  { name: "カクテル", price: 700 }, { name: "ポテトフライ", price: 400 },
  { name: "枝豆", price: 300 }, { name: "ピザ", price: 800 },
  { name: "チップ 1000枚", price: 1000 }, { name: "チップ 5000枚", price: 5000 },
];

const INIT: Visit[] = [
  { id: "v1", customer: "田中 太郎", customerNickname: "タロウ", rank: "gold", table: "T1", items: [{ name: "ビール", price: 600, qty: 2 }, { name: "枝豆", price: 300, qty: 1 }], total: 1500, status: "active" },
  { id: "v2", customer: "鈴木 花子", customerNickname: "ハナ", rank: "vip", table: "T1", items: [{ name: "ウイスキー", price: 800, qty: 1 }], total: 800, status: "active" },
  { id: "v3", customer: "佐藤 健一", customerNickname: "ケン", rank: "silver", table: "T3", items: [], total: 0, status: "active" },
  { id: "v4", customer: "高橋 美咲", customerNickname: "ミィ", rank: "regular", table: "T3", items: [{ name: "ソフトドリンク", price: 300, qty: 1 }], total: 300, status: "settled" },
];

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
      return [...prev, { name: p.name, price: p.price, qty: 1 }];
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
    <div className="space-y-3">
      {/* フィルタ + 完了トースト */}
      <div className="flex items-center gap-1">
        {(["all", "active", "settled"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-[12px] font-medium rounded-[6px] ${filter === f ? "bg-[#3a8f7c] text-white" : "text-[#5a6977] hover:bg-[#f3f0ec]"}`}>
            {f === "all" ? "すべて" : f === "active" ? "来店中" : "精算済"}
          </button>
        ))}
        <span className="ml-auto text-[12px] text-[#8e9baa]">{filtered.length}件</span>
        {done && <span className="ml-2 text-[12px] text-[#2e7d5b] font-medium toast-in">✓ 精算完了</span>}
      </div>

      {/* 一覧（インライン展開付き） */}
      <div className="overflow-hidden">
        <table className="w-full text-[13px]">
          <thead><tr className="border-b border-[#e8e4df]">
            <th className="px-4 py-2.5 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left w-8"></th>
            <th className="px-4 py-2.5 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">ニックネーム / 本名</th>
            <th className="px-4 py-2.5 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">卓</th>
            <th className="px-4 py-2.5 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">注文</th>
            <th className="px-4 py-2.5 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">金額</th>
            <th className="px-4 py-2.5 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">状態</th>
            <th className="px-4 py-2.5 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">操作</th>
          </tr></thead>
          <tbody>{filtered.map(v => (
            <React.Fragment key={v.id}>
              <tr onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                className={`border-b border-[#e8e4df] cursor-pointer hover:bg-[#f3f0ec] ${expandedId === v.id ? "bg-[#f3f0ec]" : ""}`}>
                <td className="px-4 py-2.5">
                  <ChevronDown className={`w-3.5 h-3.5 text-[#8e9baa] transition-transform ${expandedId === v.id ? "rotate-180" : ""}`} />
                </td>
                <td className="px-4 py-2.5 font-medium">
                  <div className="flex items-baseline gap-2">
                    <span>{v.customerNickname || v.customer}</span>
                    {v.customerNickname && <span className="text-[11px] text-[#8e9baa] font-normal">{v.customer}</span>}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-[#5a6977]">{v.table}</td>
                <td className="px-4 py-2.5 text-[#5a6977]">{v.items.reduce((s, i) => s + i.qty, 0)}点</td>
                <td className="px-4 py-2.5 font-medium">¥{v.total.toLocaleString()}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-[4px] ${v.status === "active" ? "bg-[#e8f5f0] text-[#2e7d5b]" : "bg-[#f3f0ec] text-[#5a6977]"}`}>
                    {v.status === "active" ? "来店中" : "精算済"}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  {v.status === "active" && (
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setOrderModalId(v.id); setCart([]); }} className="px-2 py-0.5 text-[11px] text-[#3a8f7c] bg-[#e8f5f0] rounded-[4px] hover:bg-[#d0ebe4]">
                        <Plus className="w-3 h-3 inline" /> 注文
                      </button>
                      <button onClick={() => setSettleId(v.id)} className="px-2 py-0.5 text-[11px] text-[#5a6977] hover:bg-[#f3f0ec] rounded-[4px]">
                        <CreditCard className="w-3 h-3 inline" /> 精算
                      </button>
                    </div>
                  )}
                </td>
              </tr>

              {/* インライン展開 */}
              {expandedId === v.id && (
                <tr className="fade-in"><td colSpan={7} className="px-6 py-3 bg-[#faf8f5] border-b border-[#e8e4df]">
                  {v.items.length === 0 ? (
                    <p className="text-[12px] text-[#8e9baa]">注文なし</p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-[10px] text-[#8e9baa] font-semibold uppercase tracking-wider mb-1">注文明細</p>
                      {v.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-[12px]">
                          <span className="text-[#5a6977]">{item.name} ×{item.qty}</span>
                          <span className="font-medium">¥{(item.price * item.qty).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-[13px] font-bold pt-1 border-t border-[#e8e4df] mt-1">
                        <span>合計</span><span>¥{v.total.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  {v.status === "active" && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => { setOrderModalId(v.id); setCart([]); }} className="px-3 py-[6px] text-[12px] font-medium text-[#3a8f7c] bg-[#e8f5f0] rounded-[6px] hover:bg-[#d0ebe4]">
                        <Plus className="w-3 h-3 inline mr-1" />注文追加
                      </button>
                      <button onClick={() => setSettleId(v.id)} className="px-3 py-[6px] text-[12px] font-medium text-white bg-[#3a8f7c] rounded-[6px] hover:bg-[#2f7a69]">
                        <CreditCard className="w-3 h-3 inline mr-1" />精算する
                      </button>
                    </div>
                  )}
                </td></tr>
              )}
            </React.Fragment>
          ))}</tbody>
        </table>
      </div>

      {/* ===== 注文追加モーダル ===== */}
      {orderModalId && (() => {
        const v = visits.find(x => x.id === orderModalId);
        if (!v) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setOrderModalId(null)}>
            <div className="bg-white rounded-[8px] w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#e8e4df]">
                <div>
                  <span className="text-[14px] font-semibold">{v.customerNickname || v.customer}</span>
                  {v.customerNickname && <span className="text-[11px] text-[#8e9baa] ml-2">{v.customer}</span>}
                  <span className="text-[11px] text-[#8e9baa] ml-2">卓 {v.table}</span>
                </div>
                <button onClick={() => setOrderModalId(null)} className="p-1 hover:bg-[#f3f0ec] rounded-[4px]"><X className="w-4 h-4 text-[#8e9baa]" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {PRODUCTS.map(p => {
                  const inCart = cart.find(c => c.name === p.name);
                  return (
                    <div key={p.name} className="flex items-center justify-between px-2 py-1.5 rounded-[4px] hover:bg-[#f3f0ec] cursor-pointer" onClick={() => addToCart(p)}>
                      <div><span className="text-[12px] font-medium">{p.name}</span><span className="text-[11px] text-[#8e9baa] ml-2">¥{p.price}</span></div>
                      {inCart && (
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => updateQty(p.name, -1)} className="w-5 h-5 rounded border border-[#d8d3cc] flex items-center justify-center hover:bg-[#e8e4df]"><Minus className="w-3 h-3" /></button>
                          <span className="text-[12px] font-bold w-5 text-center">{inCart.qty}</span>
                          <button onClick={() => updateQty(p.name, 1)} className="w-5 h-5 rounded border border-[#d8d3cc] flex items-center justify-center hover:bg-[#e8e4df]"><Plus className="w-3 h-3" /></button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {cart.length > 0 && (
                <div className="px-5 py-3 border-t border-[#e8e4df] space-y-2">
                  <div className="flex justify-between text-[13px]"><span className="text-[#5a6977]">追加分</span><span className="font-bold">¥{cartTotal.toLocaleString()}</span></div>
                  <button onClick={() => confirmOrder(orderModalId)} className="w-full py-2 bg-[#3a8f7c] text-white text-[13px] font-medium rounded-[6px] hover:bg-[#2f7a69]">注文を確定</button>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setSettleId(null)}>
            <div className="bg-white rounded-[8px] w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
              <h3 className="text-[14px] font-semibold mb-4">精算確認</h3>
              <div className="text-[12px] space-y-2 mb-4">
                <div className="flex justify-between"><span className="text-[#8e9baa]">顧客</span><span className="font-medium">{v.customerNickname ? `${v.customerNickname}（${v.customer}）` : v.customer}</span></div>
                <div className="flex justify-between items-end"><span className="text-[#8e9baa]">合計</span><span className="text-[22px] font-bold">¥{v.total.toLocaleString()}</span></div>
                <div>
                  <label className="text-[11px] text-[#8e9baa] font-semibold uppercase tracking-wider">支払方法</label>
                  <select className="mt-1" value={settleMethod} onChange={e => setSettleMethod(e.target.value)}>
                    <option value="cash">現金</option><option value="card">カード</option><option value="electronic">電子マネー</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => settle(settleId)} className="flex-1 py-2.5 bg-[#3a8f7c] text-white text-[13px] font-medium rounded-[6px] hover:bg-[#2f7a69]">精算する</button>
                <button onClick={() => setSettleId(null)} className="px-4 py-2.5 border border-[#d8d3cc] text-[13px] rounded-[6px] hover:bg-[#f3f0ec]">戻る</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

import React from "react";
