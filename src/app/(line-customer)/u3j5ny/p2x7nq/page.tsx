"use client";

import { useEffect, useState } from "react";
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
    <div style={{ minHeight: "100vh" }}>
      {/* ヘッダー: 席情報 */}
      {seat && (
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "var(--ln-card)",
            borderBottom: "1px solid var(--ln-border-soft)",
            boxShadow: "var(--ln-shadow-sm)",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div className="ln-row" style={{ minWidth: 0 }}>
            <Link href="/u3j5ny" className="ln-back" style={{ padding: 0 }} aria-label="戻る">
              <ArrowLeft size={16} />
            </Link>
            <div style={{ minWidth: 0 }}>
              <p className="ln-mute" style={{ fontSize: 10, margin: 0, lineHeight: 1 }}>{session.displayName}</p>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {seat.tableNo}
                <span className="ln-mute" style={{ fontSize: 11, marginLeft: 4 }}>{seat.seatNo}番席</span>
              </p>
            </div>
          </div>
          <button
            onClick={changeSeat}
            className="ln-btn ln-btn--ghost ln-btn--sm"
            style={{ fontSize: 11, padding: "0 8px", height: 28 }}
          >
            <Edit2 size={12} />席変更
          </button>
        </div>
      )}

      <div className="ln-page" style={{ paddingBottom: 96 }}>
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
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            maxWidth: 480,
            margin: "0 auto",
            background: "var(--ln-accent)",
            color: "#fff",
            border: "none",
            padding: "14px 16px",
            paddingBottom: "calc(14px + env(safe-area-inset-bottom))",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "var(--ln-shadow-lg)",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600 }}>カート {cart.reduce((s, l) => s + l.qty, 0)}点</span>
          <span style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
            確認・送信 <ChevronRight size={14} />
          </span>
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
    <div className="ln-stack">
      <div>
        <h1 className="ln-h1" style={{ marginBottom: 4 }}>席を選択してください</h1>
        <p className="ln-mute" style={{ fontSize: 12, margin: 0 }}>注文・呼び出しの前に必ず席を選択してください</p>
      </div>

      <div>
        <p className="ln-eyebrow" style={{ marginBottom: 6 }}>卓種別</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
          {(Object.keys(TABLE_TYPE_LABEL) as TableType[]).map(t => {
            const active = tableType === t;
            return (
              <button
                key={t}
                onClick={() => { setTableType(t); setTableNo(TABLES_BY_TYPE[t][0]); }}
                className={active ? "ln-btn ln-btn--primary" : "ln-btn"}
                style={{ height: 44 }}
              >
                {TABLE_TYPE_LABEL[t]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="ln-eyebrow" style={{ marginBottom: 6 }}>卓番号</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
          {tables.map(no => {
            const active = tableNo === no;
            return (
              <button
                key={no}
                onClick={() => setTableNo(no)}
                className={active ? "ln-btn ln-btn--primary ln-num" : "ln-btn ln-num"}
                style={{ height: 40, fontSize: 13 }}
              >
                {no}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="ln-eyebrow" style={{ marginBottom: 6 }}>席番号</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
            const active = seatNo === n;
            return (
              <button
                key={n}
                onClick={() => setSeatNo(n)}
                className={active ? "ln-btn ln-btn--primary" : "ln-btn"}
                style={{ aspectRatio: "1 / 1", height: "auto", borderRadius: "50%", padding: 0, fontSize: 14, fontWeight: 700 }}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => onDone({ tableType, tableNo, seatNo })}
        className="ln-btn ln-btn--primary ln-btn--full ln-btn--lg"
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
    <div className="ln-stack-sm" style={{ gap: 10 }}>
      <button
        onClick={() => onPick("drink")}
        className="ln-card"
        style={{
          width: "100%",
          padding: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          textAlign: "left",
          cursor: "pointer",
          fontFamily: "inherit",
          color: "inherit",
        }}
      >
        <div className="ln-row" style={{ gap: 12 }}>
          <Coffee size={28} style={{ color: "var(--ln-accent)" }} strokeWidth={1.6} />
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>ドリンク注文</p>
            <p className="ln-mute" style={{ fontSize: 11, margin: "2px 0 0" }}>通常・飲み放題・プレミアム</p>
          </div>
        </div>
        <ChevronRight size={20} style={{ color: "var(--ln-text-mute)" }} />
      </button>

      <button
        onClick={() => onPick("food")}
        className="ln-card"
        style={{
          width: "100%",
          padding: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          textAlign: "left",
          cursor: "pointer",
          fontFamily: "inherit",
          color: "inherit",
        }}
      >
        <div className="ln-row" style={{ gap: 12 }}>
          <Utensils size={28} style={{ color: "var(--ln-warn)" }} strokeWidth={1.6} />
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>フード注文</p>
            <p className="ln-mute" style={{ fontSize: 11, margin: "2px 0 0" }}>軽食・おつまみ</p>
          </div>
        </div>
        <ChevronRight size={20} style={{ color: "var(--ln-text-mute)" }} />
      </button>

      <button
        onClick={() => onPick("call")}
        className="ln-card"
        style={{
          width: "100%",
          padding: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          textAlign: "left",
          cursor: "pointer",
          fontFamily: "inherit",
          color: "inherit",
          background: "var(--ln-warn-soft)",
          borderColor: "transparent",
        }}
      >
        <div className="ln-row" style={{ gap: 12 }}>
          <Bell size={28} style={{ color: "var(--ln-warn)" }} strokeWidth={1.6} />
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>店員呼び出し</p>
            <p className="ln-mute" style={{ fontSize: 11, margin: "2px 0 0" }}>注文以外のご用件</p>
          </div>
        </div>
        <ChevronRight size={20} style={{ color: "var(--ln-text-mute)" }} />
      </button>

      {cartCount > 0 && (
        <button
          onClick={onCart}
          className="ln-btn ln-btn--full"
          style={{
            marginTop: 8,
            borderColor: "var(--ln-accent)",
            color: "var(--ln-accent-text)",
            fontSize: 13,
          }}
        >
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
    <div className="ln-stack">
      <button onClick={onBack} className="ln-back" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        <ArrowLeft size={14} />戻る
      </button>
      <h2 className="ln-h1">ドリンクを選択</h2>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", margin: "0 -4px", padding: "0 4px" }}>
        {(Object.keys(DRINK_CATEGORY_LABEL) as Array<keyof typeof DRINK_CATEGORY_LABEL>).map(c => {
          const active = tab === c;
          return (
            <button
              key={c}
              onClick={() => setTab(c)}
              className={active ? "ln-btn ln-btn--primary ln-btn--sm" : "ln-btn ln-btn--sm"}
              style={{ borderRadius: 999, whiteSpace: "nowrap" }}
            >
              {DRINK_CATEGORY_LABEL[c]}{c === "premium" && " ★"}
            </button>
          );
        })}
      </div>
      <div className="ln-list">
        {items.map(m => (
          <button
            key={m.id}
            onClick={() => onPick(m)}
            className="ln-list__item"
            style={{
              width: "100%",
              background: "none",
              border: "none",
              borderBottom: "1px solid var(--ln-border-soft)",
              textAlign: "left",
              cursor: "pointer",
              fontFamily: "inherit",
              color: "inherit",
            }}
          >
            <span className="ln-grow" style={{ fontSize: 14, fontWeight: 500 }}>
              {m.category === "premium" && (
                <span className="ln-chip ln-chip--gold" style={{ marginRight: 6, height: 18, fontSize: 10, padding: "0 6px" }}>
                  プレミアム
                </span>
              )}
              {m.name}
            </span>
            <ChevronRight size={16} style={{ color: "var(--ln-text-mute)" }} />
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
    <div className="ln-stack">
      <button onClick={onBack} className="ln-back" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        <ArrowLeft size={14} />戻る
      </button>
      <h2 className="ln-h1">フードを選択</h2>
      <div className="ln-list">
        {items.map(m => (
          <button
            key={m.id}
            onClick={() => onPick(m)}
            className="ln-list__item"
            style={{
              width: "100%",
              background: "none",
              border: "none",
              borderBottom: "1px solid var(--ln-border-soft)",
              textAlign: "left",
              cursor: "pointer",
              fontFamily: "inherit",
              color: "inherit",
            }}
          >
            <span className="ln-grow" style={{ fontSize: 14, fontWeight: 500 }}>{m.name}</span>
            <ChevronRight size={16} style={{ color: "var(--ln-text-mute)" }} />
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
    <div className="ln-stack">
      <button onClick={onBack} className="ln-back" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        <ArrowLeft size={14} />戻る
      </button>
      <div>
        {menu.category === "premium" && (
          <span className="ln-chip ln-chip--gold" style={{ marginBottom: 6 }}>プレミアム</span>
        )}
        <h2 className="ln-h1" style={{ marginTop: menu.category === "premium" ? 6 : 0 }}>{menu.name}</h2>
      </div>

      {(menu.hotIce || menu.ice || menu.straw || menu.chopsticks || menu.plate || menu.sauceSeparate) && (
        <div className="ln-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
            <label className="ln-spread">
              <span style={{ fontSize: 13, fontWeight: 500 }}>ソース別添え</span>
              <input
                type="checkbox"
                checked={!!options.sauceSeparate}
                onChange={e => setOptions(p => ({ ...p, sauceSeparate: e.target.checked }))}
                style={{ width: "auto", padding: 0 }}
              />
            </label>
          )}
        </div>
      )}

      <div>
        <p className="ln-eyebrow" style={{ marginBottom: 6 }}>数量</p>
        <div className="ln-card ln-card-compact" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: "12px 14px" }}>
          <button
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="ln-btn"
            style={{ width: 40, height: 40, padding: 0, borderRadius: "50%" }}
            aria-label="減らす"
          >
            <Minus size={16} />
          </button>
          <span className="ln-num" style={{ fontSize: 24, fontWeight: 700, width: 48, textAlign: "center" }}>{qty}</span>
          <button
            onClick={() => setQty(qty + 1)}
            className="ln-btn"
            style={{ width: 40, height: 40, padding: 0, borderRadius: "50%" }}
            aria-label="増やす"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div>
        <p className="ln-eyebrow" style={{ marginBottom: 6 }}>備考 (任意)</p>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={2}
          style={{ resize: "none", fontSize: 13 }}
          placeholder="アレルギー対応など"
        />
      </div>

      <button onClick={add} className="ln-btn ln-btn--primary ln-btn--full ln-btn--lg">
        カートに追加
      </button>
    </div>
  );
}

function PickToggle({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="ln-eyebrow" style={{ marginBottom: 6 }}>{label}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
        {options.map(o => {
          const active = value === o;
          return (
            <button
              key={o}
              onClick={() => onChange(o)}
              className={active ? "ln-btn ln-btn--primary" : "ln-btn"}
              style={{ height: 38, fontSize: 13 }}
            >
              {o}
            </button>
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
    <div className="ln-stack">
      <button onClick={onBack} className="ln-back" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        <ArrowLeft size={14} />戻る
      </button>
      <h2 className="ln-h1">注文内容の確認</h2>
      {cart.length === 0 ? (
        <p className="ln-empty">カートは空です</p>
      ) : (
        <div className="ln-stack-sm">
          {cart.map(l => (
            <div key={l.id} className="ln-card ln-card-compact" style={{ position: "relative" }}>
              <button
                onClick={() => onRemove(l.id)}
                aria-label="削除"
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "none",
                  border: "none",
                  color: "var(--ln-text-mute)",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <X size={14} />
              </button>
              <p style={{ fontSize: 14, fontWeight: 600, margin: 0, paddingRight: 24 }}>{l.menu.name}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                {Object.entries(l.options).filter(([, v]) => v !== false && v !== "").map(([k, v]) => (
                  <span
                    key={k}
                    className="ln-chip"
                    style={{ fontSize: 10, height: 18, padding: "0 6px" }}
                  >
                    {typeof v === "boolean" ? optionLabel(k) : String(v)}
                  </span>
                ))}
              </div>
              {l.note && (
                <p className="ln-mute" style={{ fontSize: 11, margin: "4px 0 0" }}>
                  📝 {l.note}
                </p>
              )}
              <div className="ln-row" style={{ marginTop: 8 }}>
                <button
                  onClick={() => onUpdateQty(l.id, l.qty - 1)}
                  className="ln-btn"
                  style={{ width: 28, height: 28, padding: 0, borderRadius: "50%" }}
                  aria-label="減らす"
                >
                  <Minus size={12} />
                </button>
                <span className="ln-num" style={{ fontSize: 14, fontWeight: 700, width: 32, textAlign: "center" }}>{l.qty}</span>
                <button
                  onClick={() => onUpdateQty(l.id, l.qty + 1)}
                  className="ln-btn"
                  style={{ width: 28, height: 28, padding: 0, borderRadius: "50%" }}
                  aria-label="増やす"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={onSubmit}
        disabled={cart.length === 0}
        className="ln-btn ln-btn--primary ln-btn--full ln-btn--lg"
        style={{ opacity: cart.length === 0 ? 0.5 : 1 }}
      >
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
    <div className="ln-stack">
      <button onClick={onBack} className="ln-back" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        <ArrowLeft size={14} />戻る
      </button>
      <h2 className="ln-h1" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Bell size={20} style={{ color: "var(--ln-warn)" }} />店員呼び出し
      </h2>
      <p className="ln-mute" style={{ fontSize: 12, margin: 0 }}>店員がお伺いします</p>
      <div className="ln-stack-sm">
        {(Object.keys(CALL_REASON_LABEL) as CallReasonType[]).map(r => {
          const active = type === r;
          return (
            <button
              key={r}
              onClick={() => setType(r)}
              className={active ? "ln-btn ln-btn--primary ln-btn--full" : "ln-btn ln-btn--full"}
              style={{ height: 44, fontSize: 14 }}
            >
              {CALL_REASON_LABEL[r]}
            </button>
          );
        })}
      </div>
      {type === "other" && (
        <div>
          <p className="ln-eyebrow" style={{ marginBottom: 6 }}>ご用件</p>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={2}
            style={{ resize: "none", fontSize: 13 }}
          />
        </div>
      )}
      <button
        onClick={() => onSubmit({ type, text: type === "other" ? text.trim() || undefined : undefined })}
        disabled={type === "other" && !text.trim()}
        className="ln-btn ln-btn--warn ln-btn--full ln-btn--lg"
        style={{ opacity: type === "other" && !text.trim() ? 0.5 : 1 }}
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "40px 0", gap: 14 }}>
      <CheckCircle size={64} style={{ color: "var(--ln-accent)" }} strokeWidth={1.5} />
      <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>送信しました</p>
      <p className="ln-mute" style={{ fontSize: 12, margin: 0, lineHeight: 1.7 }}>
        店員が確認しています。<br />しばらくお待ちください。
      </p>
      <button
        onClick={onBack}
        className="ln-btn"
        style={{ marginTop: 8, fontSize: 13 }}
      >
        メニューに戻る
      </button>
    </div>
  );
}
