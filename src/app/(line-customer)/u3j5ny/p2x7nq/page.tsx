"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle, ChevronRight, Coffee, Utensils, Bell, Plus, Minus, X, Edit2,
} from "lucide-react";
import { LiffGate, type LiffSession } from "@/lib/liff/gate";
import { orderStore } from "@/lib/orders/store";
import {
  type Seat, type TableType, type Order, type OrderItem, type CallReasonType,
  TABLE_TYPE_LABEL, TABLES_BY_TYPE, CALL_REASON_LABEL,
} from "@/lib/orders/types";
import { MENU, DRINK_CATEGORY_LABEL, type MenuItem } from "@/lib/orders/menu";

const SEAT_KEY = "tempo_my_seat_v1";

type Step =
  | { kind: "seat" }
  | { kind: "menu" }
  | { kind: "drink" }
  | { kind: "food" }
  | { kind: "call" }
  | { kind: "item"; menu: MenuItem }
  | { kind: "cart" }
  | { kind: "done" };

interface CartLine {
  id: string;
  menu: MenuItem;
  qty: number;
  options: Record<string, string | boolean>;
  note?: string;
}

export default function CustomerOrderPage() {
  return (
    <LiffGate>
      {(session) => <OrderShell session={session} />}
    </LiffGate>
  );
}

function OrderShell({ session }: { session: LiffSession }) {
  const [seat, setSeat] = useState<Seat | null>(null);
  const [step, setStep] = useState<Step>({ kind: "seat" });
  const [cart, setCart] = useState<CartLine[]>([]);

  // 席の永続化
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SEAT_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Seat;
        setSeat(s);
        setStep({ kind: "menu" });
      }
    } catch { /* */ }
  }, []);
  useEffect(() => {
    if (seat) {
      try { localStorage.setItem(SEAT_KEY, JSON.stringify(seat)); } catch { /* */ }
    }
  }, [seat]);

  function changeSeat() {
    setStep({ kind: "seat" });
  }

  function addToCart(line: CartLine) {
    setCart(prev => [...prev, line]);
  }
  function removeFromCart(id: string) {
    setCart(prev => prev.filter(l => l.id !== id));
  }
  function updateCartQty(id: string, qty: number) {
    setCart(prev => prev.map(l => l.id === id ? { ...l, qty: Math.max(1, qty) } : l));
  }

  function submitCart() {
    if (!seat || cart.length === 0) return;
    // ドリンクとフードを分けて送信(管理側で表示しやすいよう種別ごと)
    const drinkLines = cart.filter(l => l.menu.kind === "drink");
    const foodLines = cart.filter(l => l.menu.kind === "food");

    const now = new Date().toISOString();
    const customer = { lineUserId: session.userId, displayName: session.displayName };

    if (drinkLines.length > 0) {
      const order: Order = {
        id: `o-${Date.now()}-d`, createdAt: now, updatedAt: now,
        seat, kind: "drink", status: "new", customer,
        items: drinkLines.map<OrderItem>(l => ({
          productId: l.menu.id, name: l.menu.name, category: l.menu.category,
          qty: l.qty, options: l.options, note: l.note,
        })),
      };
      orderStore.add(order);
    }
    if (foodLines.length > 0) {
      const order: Order = {
        id: `o-${Date.now()}-f`, createdAt: now, updatedAt: now,
        seat, kind: "food", status: "new", customer,
        items: foodLines.map<OrderItem>(l => ({
          productId: l.menu.id, name: l.menu.name, category: l.menu.category,
          qty: l.qty, options: l.options, note: l.note,
        })),
      };
      orderStore.add(order);
    }
    setCart([]);
    setStep({ kind: "done" });
  }

  function submitCall(reason: { type: CallReasonType; text?: string }) {
    if (!seat) return;
    const now = new Date().toISOString();
    const order: Order = {
      id: `o-${Date.now()}-c`, createdAt: now, updatedAt: now,
      seat, kind: "call", status: "new",
      call: reason,
      customer: { lineUserId: session.userId, displayName: session.displayName },
    };
    orderStore.add(order);
    setStep({ kind: "done" });
  }

  return (
    <div className="min-h-screen">
      {/* ヘッダー: 席情報 */}
      {seat && (
        <div className="sticky top-0 z-10 bg-bg-white border-b border-border-light px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/u3j5ny" className="text-text-tertiary"><ArrowLeft className="w-4 h-4" /></Link>
            <div className="min-w-0">
              <p className="text-[10px] text-text-tertiary leading-none">{session.displayName}</p>
              <p className="text-[13px] font-semibold text-text-primary leading-tight truncate">
                {seat.tableNo} <span className="text-text-tertiary text-[11px] ml-1">{seat.seatNo}番席</span>
              </p>
            </div>
          </div>
          <button onClick={changeSeat} className="flex items-center gap-1 text-[11px] text-text-secondary hover:text-text-primary px-2 py-1 rounded">
            <Edit2 className="w-3 h-3" />席変更
          </button>
        </div>
      )}

      <div className="p-4 pb-24">
        {step.kind === "seat" && (
          <SeatPicker
            initial={seat}
            onDone={(s) => { setSeat(s); setStep({ kind: "menu" }); }}
          />
        )}
        {step.kind === "menu" && seat && (
          <MainMenu
            onPick={(k) => setStep({ kind: k })}
            cartCount={cart.length}
            onCart={() => setStep({ kind: "cart" })}
          />
        )}
        {step.kind === "drink" && (
          <DrinkList onPick={(m) => setStep({ kind: "item", menu: m })} onBack={() => setStep({ kind: "menu" })} />
        )}
        {step.kind === "food" && (
          <FoodList onPick={(m) => setStep({ kind: "item", menu: m })} onBack={() => setStep({ kind: "menu" })} />
        )}
        {step.kind === "call" && seat && (
          <CallForm onSubmit={submitCall} onBack={() => setStep({ kind: "menu" })} />
        )}
        {step.kind === "item" && (
          <ItemConfig
            menu={step.menu}
            onAdd={(line) => { addToCart(line); setStep({ kind: step.menu.kind === "drink" ? "drink" : "food" }); }}
            onBack={() => setStep({ kind: step.menu.kind === "drink" ? "drink" : "food" })}
          />
        )}
        {step.kind === "cart" && (
          <CartView
            cart={cart}
            onUpdateQty={updateCartQty}
            onRemove={removeFromCart}
            onSubmit={submitCart}
            onBack={() => setStep({ kind: "menu" })}
          />
        )}
        {step.kind === "done" && (
          <DoneScreen onBack={() => setStep({ kind: "menu" })} />
        )}
      </div>

      {/* カートバー(フッター) */}
      {cart.length > 0 && step.kind !== "cart" && step.kind !== "done" && step.kind !== "seat" && (
        <button
          onClick={() => setStep({ kind: "cart" })}
          className="fixed bottom-0 left-0 right-0 bg-accent text-white py-3.5 px-4 flex items-center justify-between shadow-lg max-w-[480px] mx-auto"
        >
          <span className="text-[14px] font-semibold">カート {cart.reduce((s, l) => s + l.qty, 0)}点</span>
          <span className="text-[12px] flex items-center gap-1">確認・送信 <ChevronRight className="w-3.5 h-3.5" /></span>
        </button>
      )}
    </div>
  );
}

// ========================================
// 席選択
// ========================================
function SeatPicker({ initial, onDone }: { initial: Seat | null; onDone: (s: Seat) => void }) {
  const [tableType, setTableType] = useState<TableType>(initial?.tableType ?? "A");
  const [tableNo, setTableNo] = useState<string>(initial?.tableNo ?? TABLES_BY_TYPE.A[0]);
  const [seatNo, setSeatNo] = useState<number>(initial?.seatNo ?? 1);

  const tables = TABLES_BY_TYPE[tableType];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[18px] font-bold text-text-primary mb-1">席を選択してください</h1>
        <p className="text-[12px] text-text-tertiary">注文・呼び出しの前に必ず席を選択してください</p>
      </div>

      <div>
        <label className="block text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">卓種別</label>
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.keys(TABLE_TYPE_LABEL) as TableType[]).map(t => {
            const active = tableType === t;
            return (
              <button
                key={t}
                onClick={() => { setTableType(t); setTableNo(TABLES_BY_TYPE[t][0]); }}
                className={`py-3 text-[13px] font-medium rounded-[6px] border transition-colors ${
                  active ? "bg-text-primary text-white border-text-primary" : "bg-bg-white text-text-primary border-border"
                }`}
              >{TABLE_TYPE_LABEL[t]}</button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">卓番号</label>
        <div className="grid grid-cols-3 gap-1.5">
          {tables.map(no => {
            const active = tableNo === no;
            return (
              <button
                key={no}
                onClick={() => setTableNo(no)}
                className={`py-2.5 text-[13px] font-mono font-semibold rounded-[6px] border transition-colors ${
                  active ? "bg-text-primary text-white border-text-primary" : "bg-bg-white text-text-primary border-border"
                }`}
              >{no}</button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">席番号</label>
        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
            const active = seatNo === n;
            return (
              <button
                key={n}
                onClick={() => setSeatNo(n)}
                className={`aspect-square text-[14px] font-bold rounded-full border transition-colors ${
                  active ? "bg-accent text-white border-accent" : "bg-bg-white text-text-primary border-border"
                }`}
              >{n}</button>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => onDone({ tableType, tableNo, seatNo })}
        className="w-full py-3 bg-accent text-white text-[14px] font-semibold rounded-[6px]"
      >
        {tableNo} / {seatNo}番席 で確定
      </button>
    </div>
  );
}

// ========================================
// メインメニュー(大ボタン3つ)
// ========================================
function MainMenu({ onPick, cartCount, onCart }: { onPick: (k: "drink" | "food" | "call") => void; cartCount: number; onCart: () => void }) {
  return (
    <div className="space-y-2.5">
      <button onClick={() => onPick("drink")} className="w-full bg-bg-white border border-border rounded-[10px] p-5 flex items-center justify-between hover:bg-bg-hover transition-colors text-left">
        <div className="flex items-center gap-3">
          <Coffee className="w-7 h-7 text-accent" strokeWidth={1.6} />
          <div>
            <p className="text-[16px] font-bold">ドリンク注文</p>
            <p className="text-[11px] text-text-tertiary mt-0.5">通常・飲み放題・プレミアム</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-text-tertiary" />
      </button>

      <button onClick={() => onPick("food")} className="w-full bg-bg-white border border-border rounded-[10px] p-5 flex items-center justify-between hover:bg-bg-hover transition-colors text-left">
        <div className="flex items-center gap-3">
          <Utensils className="w-7 h-7 text-[#d97706]" strokeWidth={1.6} />
          <div>
            <p className="text-[16px] font-bold">フード注文</p>
            <p className="text-[11px] text-text-tertiary mt-0.5">軽食・おつまみ</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-text-tertiary" />
      </button>

      <button onClick={() => onPick("call")} className="w-full bg-[#fef7e0] border border-[#c87b1a]/30 rounded-[10px] p-5 flex items-center justify-between hover:bg-[#fcecc4] transition-colors text-left">
        <div className="flex items-center gap-3">
          <Bell className="w-7 h-7 text-[#c87b1a]" strokeWidth={1.6} />
          <div>
            <p className="text-[16px] font-bold">店員呼び出し</p>
            <p className="text-[11px] text-text-tertiary mt-0.5">注文以外のご用件</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-text-tertiary" />
      </button>

      {cartCount > 0 && (
        <button onClick={onCart} className="w-full mt-4 py-3 border border-accent text-accent text-[13px] font-medium rounded-[6px]">
          カートを確認 ({cartCount}点)
        </button>
      )}
    </div>
  );
}

// ========================================
// ドリンク一覧
// ========================================
function DrinkList({ onPick, onBack }: { onPick: (m: MenuItem) => void; onBack: () => void }) {
  const [tab, setTab] = useState<"regular" | "tabehoudai" | "premium">("regular");
  const items = MENU.filter(m => m.kind === "drink" && m.category === tab);
  return (
    <div className="space-y-3">
      <button onClick={onBack} className="flex items-center gap-1 text-[12px] text-text-tertiary"><ArrowLeft className="w-3.5 h-3.5" />戻る</button>
      <h2 className="text-[16px] font-bold">ドリンクを選択</h2>
      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1">
        {(Object.keys(DRINK_CATEGORY_LABEL) as Array<keyof typeof DRINK_CATEGORY_LABEL>).map(c => {
          const active = tab === c;
          return (
            <button
              key={c}
              onClick={() => setTab(c)}
              className={`px-4 py-1.5 text-[12px] font-medium rounded-full whitespace-nowrap border ${
                active ? "bg-text-primary text-white border-text-primary" : "bg-bg-white text-text-secondary border-border"
              }`}
            >{DRINK_CATEGORY_LABEL[c]}{c === "premium" && " ★"}</button>
          );
        })}
      </div>
      <div className="space-y-1.5">
        {items.map(m => (
          <button key={m.id} onClick={() => onPick(m)} className="w-full bg-bg-white border border-border rounded-[8px] px-4 py-3 flex items-center justify-between hover:bg-bg-hover transition-colors text-left">
            <span className="text-[14px] font-medium">
              {m.category === "premium" && <span className="text-[10px] text-[#c87b1a] mr-1.5">【プレミアム】</span>}
              {m.name}
            </span>
            <ChevronRight className="w-4 h-4 text-text-tertiary" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ========================================
// フード一覧
// ========================================
function FoodList({ onPick, onBack }: { onPick: (m: MenuItem) => void; onBack: () => void }) {
  const items = MENU.filter(m => m.kind === "food");
  return (
    <div className="space-y-3">
      <button onClick={onBack} className="flex items-center gap-1 text-[12px] text-text-tertiary"><ArrowLeft className="w-3.5 h-3.5" />戻る</button>
      <h2 className="text-[16px] font-bold">フードを選択</h2>
      <div className="space-y-1.5">
        {items.map(m => (
          <button key={m.id} onClick={() => onPick(m)} className="w-full bg-bg-white border border-border rounded-[8px] px-4 py-3 flex items-center justify-between hover:bg-bg-hover transition-colors text-left">
            <span className="text-[14px] font-medium">{m.name}</span>
            <ChevronRight className="w-4 h-4 text-text-tertiary" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ========================================
// 商品オプション設定
// ========================================
function ItemConfig({ menu, onAdd, onBack }: { menu: MenuItem; onAdd: (line: CartLine) => void; onBack: () => void }) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [options, setOptions] = useState<Record<string, string | boolean>>(() => {
    const o: Record<string, string | boolean> = {};
    if (menu.hotIce) o.hotIce = "ICE";
    if (menu.ice) o.ice = "氷あり";
    if (menu.straw) o.straw = "ストローあり";
    if (menu.chopsticks) o.chopsticks = "箸あり";
    if (menu.plate) o.plate = "取り皿あり";
    if (menu.sauceSeparate) o.sauceSeparate = false;
    return o;
  });

  function add() {
    onAdd({
      id: `${menu.id}-${Date.now()}`,
      menu, qty, options,
      note: note.trim() || undefined,
    });
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-[12px] text-text-tertiary"><ArrowLeft className="w-3.5 h-3.5" />戻る</button>
      <div>
        {menu.category === "premium" && <p className="text-[10px] text-[#c87b1a] font-semibold mb-1">【プレミアム】</p>}
        <h2 className="text-[18px] font-bold">{menu.name}</h2>
      </div>

      <div className="space-y-3 bg-bg-white border border-border rounded-[8px] p-4">
        {menu.hotIce && (
          <PickToggle label="HOT/ICE" value={options.hotIce as string} options={["HOT", "ICE"]} onChange={v => setOptions(p => ({ ...p, hotIce: v }))} />
        )}
        {menu.ice && (
          <PickToggle label="氷" value={options.ice as string} options={["氷あり", "氷なし"]} onChange={v => setOptions(p => ({ ...p, ice: v }))} />
        )}
        {menu.straw && (
          <PickToggle label="ストロー" value={options.straw as string} options={["ストローあり", "ストローなし"]} onChange={v => setOptions(p => ({ ...p, straw: v }))} />
        )}
        {menu.chopsticks && (
          <PickToggle label="箸" value={options.chopsticks as string} options={["箸あり", "箸なし"]} onChange={v => setOptions(p => ({ ...p, chopsticks: v }))} />
        )}
        {menu.plate && (
          <PickToggle label="取り皿" value={options.plate as string} options={["取り皿あり", "取り皿なし"]} onChange={v => setOptions(p => ({ ...p, plate: v }))} />
        )}
        {menu.sauceSeparate && (
          <label className="flex items-center justify-between">
            <span className="text-[12px] font-medium">ソース別添え</span>
            <input type="checkbox" checked={!!options.sauceSeparate} onChange={e => setOptions(p => ({ ...p, sauceSeparate: e.target.checked }))} />
          </label>
        )}
      </div>

      <div>
        <label className="block text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">数量</label>
        <div className="flex items-center justify-center gap-4 py-3 bg-bg-white border border-border rounded-[8px]">
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 border border-border rounded-full flex items-center justify-center"><Minus className="w-4 h-4" /></button>
          <span className="text-[24px] font-bold tabular-nums w-12 text-center">{qty}</span>
          <button onClick={() => setQty(qty + 1)} className="w-10 h-10 border border-border rounded-full flex items-center justify-center"><Plus className="w-4 h-4" /></button>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">備考 (任意)</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className="resize-none text-[13px]" placeholder="アレルギー対応など" />
      </div>

      <button onClick={add} className="w-full py-3 bg-accent text-white text-[14px] font-semibold rounded-[6px]">
        カートに追加
      </button>
    </div>
  );
}

function PickToggle({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">{label}</p>
      <div className="grid grid-cols-2 gap-1.5">
        {options.map(o => {
          const active = value === o;
          return (
            <button
              key={o}
              onClick={() => onChange(o)}
              className={`py-2 text-[13px] font-medium rounded-[6px] border ${
                active ? "bg-text-primary text-white border-text-primary" : "bg-bg-white text-text-primary border-border"
              }`}
            >{o}</button>
          );
        })}
      </div>
    </div>
  );
}

// ========================================
// カート
// ========================================
function CartView({ cart, onUpdateQty, onRemove, onSubmit, onBack }: {
  cart: CartLine[];
  onUpdateQty: (id: string, q: number) => void;
  onRemove: (id: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-[12px] text-text-tertiary"><ArrowLeft className="w-3.5 h-3.5" />戻る</button>
      <h2 className="text-[18px] font-bold">注文内容の確認</h2>
      {cart.length === 0 ? (
        <p className="text-center text-[12px] text-text-tertiary py-8">カートは空です</p>
      ) : (
        <div className="space-y-2">
          {cart.map(l => (
            <div key={l.id} className="bg-bg-white border border-border rounded-[8px] p-3 relative">
              <button onClick={() => onRemove(l.id)} className="absolute top-2 right-2 text-text-tertiary"><X className="w-3.5 h-3.5" /></button>
              <p className="text-[14px] font-semibold">{l.menu.name}</p>
              <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                {Object.entries(l.options).filter(([, v]) => v !== false && v !== "").map(([k, v]) => (
                  <span key={k} className="px-1.5 py-0.5 bg-bg-hover rounded text-text-secondary">{typeof v === "boolean" ? optionLabel(k) : String(v)}</span>
                ))}
              </div>
              {l.note && <p className="text-[11px] text-text-tertiary mt-1">📝 {l.note}</p>}
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => onUpdateQty(l.id, l.qty - 1)} className="w-7 h-7 border border-border rounded-full flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                <span className="text-[14px] font-bold tabular-nums w-8 text-center">{l.qty}</span>
                <button onClick={() => onUpdateQty(l.id, l.qty + 1)} className="w-7 h-7 border border-border rounded-full flex items-center justify-center"><Plus className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <button onClick={onSubmit} disabled={cart.length === 0} className="w-full py-3 bg-accent text-white text-[14px] font-semibold rounded-[6px] disabled:opacity-50">
        注文を送信 ({cart.reduce((s, l) => s + l.qty, 0)}点)
      </button>
    </div>
  );
}

function optionLabel(k: string) {
  return { sauceSeparate: "ソース別添え" }[k] ?? k;
}

// ========================================
// 店員呼び出し
// ========================================
function CallForm({ onSubmit, onBack }: { onSubmit: (r: { type: CallReasonType; text?: string }) => void; onBack: () => void }) {
  const [type, setType] = useState<CallReasonType>("order");
  const [text, setText] = useState("");

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-[12px] text-text-tertiary"><ArrowLeft className="w-3.5 h-3.5" />戻る</button>
      <h2 className="text-[18px] font-bold flex items-center gap-2">
        <Bell className="w-5 h-5 text-[#c87b1a]" />店員呼び出し
      </h2>
      <p className="text-[12px] text-text-tertiary">店員がお伺いします</p>
      <div className="space-y-1.5">
        {(Object.keys(CALL_REASON_LABEL) as CallReasonType[]).map(r => {
          const active = type === r;
          return (
            <button
              key={r}
              onClick={() => setType(r)}
              className={`w-full py-3 text-[14px] font-medium rounded-[8px] border transition-colors ${
                active ? "bg-text-primary text-white border-text-primary" : "bg-bg-white text-text-primary border-border"
              }`}
            >{CALL_REASON_LABEL[r]}</button>
          );
        })}
      </div>
      {type === "other" && (
        <div>
          <label className="block text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">ご用件</label>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={2} className="resize-none text-[13px]" />
        </div>
      )}
      <button
        onClick={() => onSubmit({ type, text: type === "other" ? text.trim() || undefined : undefined })}
        disabled={type === "other" && !text.trim()}
        className="w-full py-3 bg-[#c87b1a] text-white text-[14px] font-semibold rounded-[6px] disabled:opacity-50"
      >
        店員を呼ぶ
      </button>
    </div>
  );
}

// ========================================
// 送信完了
// ========================================
function DoneScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-10 space-y-4">
      <CheckCircle className="w-16 h-16 text-accent" strokeWidth={1.5} />
      <p className="text-[16px] font-bold">送信しました</p>
      <p className="text-[12px] text-text-tertiary leading-[1.7]">店員が確認しています。<br />しばらくお待ちください。</p>
      <button onClick={onBack} className="mt-4 px-5 py-2 border border-border text-[13px] rounded-[6px]">メニューに戻る</button>
    </div>
  );
}

// 未使用警告回避
void useMemo;
