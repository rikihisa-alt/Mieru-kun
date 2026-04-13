"use client";

import { useState } from "react";
import { ShoppingBag, CreditCard, Plus, Minus, CheckCircle } from "lucide-react";

interface CartItem { name: string; price: number; qty: number; }
interface Visit {
  id: string; customer: string; rank: string; table: string;
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
  { id: "v1", customer: "田中 太郎", rank: "gold", table: "T1", items: [{ name: "ビール", price: 600, qty: 2 }, { name: "枝豆", price: 300, qty: 1 }], total: 1500, status: "active" },
  { id: "v2", customer: "鈴木 花子", rank: "vip", table: "T1", items: [{ name: "ウイスキー", price: 800, qty: 1 }], total: 800, status: "active" },
  { id: "v3", customer: "佐藤 健一", rank: "silver", table: "T3", items: [], total: 0, status: "active" },
  { id: "v4", customer: "高橋 美咲", rank: "regular", table: "T3", items: [{ name: "ソフトドリンク", price: 300, qty: 1 }], total: 300, status: "settled" },
];

export default function OrdersPage() {
  const [visits, setVisits] = useState<Visit[]>(INIT);
  const [selId, setSelId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "settled">("all");
  const [settleId, setSettleId] = useState<string | null>(null);
  const [settleMethod, setSettleMethod] = useState("cash");
  const [done, setDone] = useState(false);

  const filtered = visits.filter(v => filter === "all" || v.status === filter);
  const sel = visits.find(v => v.id === selId);
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
  function confirmOrder() {
    if (!selId || !cart.length) return;
    setVisits(prev => prev.map(v => v.id === selId ? { ...v, items: [...v.items, ...cart], total: v.total + cartTotal } : v));
    setCart([]);
  }
  function settle(id: string) {
    setVisits(prev => prev.map(v => v.id === id ? { ...v, status: "settled" as const } : v));
    setSettleId(null); setDone(true);
    setTimeout(() => setDone(false), 2000);
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-7rem)]">
      {/* 左: 来店一覧 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-1 mb-3">
          {(["all", "active", "settled"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-[12px] font-medium rounded-[6px] transition-colors ${filter === f ? "bg-[#3a8f7c] text-white" : "text-[#5a6977] hover:bg-[#f3f0ec]"}`}>
              {f === "all" ? "すべて" : f === "active" ? "来店中" : "精算済"}
            </button>
          ))}
          <span className="ml-auto text-[12px] text-[#8e9baa]">{filtered.length}件</span>
        </div>
        <div className="bg-white border border-[#d8d3cc] rounded-[8px] overflow-auto flex-1">
          <table className="w-full text-[13px]">
            <thead><tr className="border-b border-[#d8d3cc] bg-[#faf8f5]">
              <th className="px-4 py-2.5 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">顧客</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">卓</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">注文</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">金額</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">状態</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">操作</th>
            </tr></thead>
            <tbody>{filtered.map(v => (
              <tr key={v.id} onClick={() => { setSelId(v.id); setCart([]); }}
                className={`border-b border-[#e8e4df] cursor-pointer transition-colors ${selId === v.id ? "bg-[#e8f5f0]/40" : "hover:bg-[#f3f0ec]"}`}>
                <td className="px-4 py-2.5 font-medium">{v.customer}</td>
                <td className="px-4 py-2.5 text-[#5a6977]">{v.table}</td>
                <td className="px-4 py-2.5 text-[#5a6977]">{v.items.reduce((s, i) => s + i.qty, 0)}点</td>
                <td className="px-4 py-2.5 font-medium">¥{v.total.toLocaleString()}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-[4px] ${v.status === "active" ? "bg-[#e6f4ea] text-[#188038]" : "bg-[#e8f5f0] text-[#3a8f7c]"}`}>
                    {v.status === "active" ? "来店中" : "精算済"}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  {v.status === "active" && (
                    <button onClick={e => { e.stopPropagation(); setSettleId(v.id); }}
                      className="flex items-center gap-1 px-2.5 py-1 text-[12px] text-[#3a8f7c] hover:bg-[#e8f5f0] rounded-[4px] transition-colors">
                      <CreditCard className="w-3 h-3" />精算
                    </button>
                  )}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      {/* 右: 注文/精算パネル */}
      <div className="w-80 bg-white border border-[#d8d3cc] rounded-[8px] flex flex-col overflow-hidden">
        {settleId ? (() => { const v = visits.find(x => x.id === settleId); if (!v) return null; return (
          <div className="p-4 space-y-3">
            <h3 className="text-[14px] font-semibold">精算確認</h3>
            <div className="text-[12px] space-y-2">
              <div className="flex justify-between"><span className="text-[#8e9baa]">顧客</span><span className="font-medium">{v.customer}</span></div>
              <div className="flex justify-between items-end"><span className="text-[#8e9baa]">合計</span><span className="text-[22px] font-bold">¥{v.total.toLocaleString()}</span></div>
              <div>
                <label className="text-[11px] text-[#8e9baa] font-semibold uppercase tracking-wider">支払方法</label>
                <select className="mt-1" value={settleMethod} onChange={e => setSettleMethod(e.target.value)}>
                  <option value="cash">現金</option><option value="card">カード</option><option value="electronic">電子マネー</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => settle(settleId)} className="flex-1 py-2.5 bg-[#3a8f7c] text-white text-[13px] font-medium rounded-[6px] hover:bg-[#2f7a69] transition-colors">精算する</button>
                <button onClick={() => setSettleId(null)} className="px-3 py-2.5 border border-[#d8d3cc] text-[13px] rounded-[6px] hover:bg-[#f3f0ec] transition-colors">戻る</button>
              </div>
            </div>
          </div>
        ); })()
        : done ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <CheckCircle className="w-12 h-12 text-[#188038] mb-2" />
            <p className="text-[15px] font-semibold text-[#188038]">精算完了</p>
          </div>
        ) : sel && sel.status === "active" ? (
          <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-[#e8e4df]">
              <span className="text-[13px] font-semibold">{sel.customer}</span>
              <span className="text-[11px] text-[#8e9baa] ml-2">卓 {sel.table}</span>
            </div>
            {/* 既存注文 */}
            {sel.items.length > 0 && (
              <div className="px-4 py-2 border-b border-[#e8e4df] bg-[#faf8f5]">
                <p className="text-[10px] text-[#8e9baa] font-semibold uppercase tracking-wider mb-1">注文済み</p>
                {sel.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px] text-[#5a6977]">
                    <span>{item.name} ×{item.qty}</span><span>¥{(item.price * item.qty).toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between text-[12px] font-medium mt-1 pt-1 border-t border-[#d8d3cc]">
                  <span>小計</span><span>¥{sel.total.toLocaleString()}</span>
                </div>
              </div>
            )}
            {/* 商品リスト */}
            <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
              <p className="text-[10px] text-[#8e9baa] font-semibold uppercase tracking-wider mb-1">商品を追加</p>
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
            {/* カートフッター */}
            {cart.length > 0 && (
              <div className="px-4 py-3 border-t border-[#e8e4df] space-y-2">
                <div className="flex justify-between text-[13px]"><span className="text-[#5a6977]">追加分</span><span className="font-bold">¥{cartTotal.toLocaleString()}</span></div>
                <button onClick={confirmOrder} className="w-full py-2 bg-[#3a8f7c] text-white text-[13px] font-medium rounded-[6px] hover:bg-[#2f7a69] transition-colors">注文を確定</button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-[#d8d3cc]" />
              <p className="text-[12px] text-[#8e9baa]">来店中の顧客を選択</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
