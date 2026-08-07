"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { usePersisted, usePersistedState } from "@/lib/persist/store";
import { productStore, customerStore, type CustomerRank } from "@/lib/store/domain-stores";
import { useStoreSettings, DEFAULT_STORE_NAME } from "@/lib/store/settings";
import { salesOrderStore, type SalesOrder, type SalesOrderItem, stockMovementStore, chipFlowStore, type ChipFlowEntry } from "@/lib/v2/stores";
import { grantSpendPoints } from "@/lib/v2/points";
import { PageHeader, Btn, Panel, Modal, VStack, HStack, Chip, Empty, Field, Toast, useToast, Banner, FilterChips, SectionLabel } from "@/components/v2/ui";
import { Plus, Minus, CreditCard, Trash2, X, Printer, Receipt as ReceiptIcon, Clock } from "lucide-react";
import { printReceipt } from "@/lib/v2/pdf";
import { TIME_CHARGE_KEY, DEFAULT_TIME_CHARGE, calcTimeChargeUnits, calcTimeChargeAmount, type TimeChargeSettings } from "@/app/k4z8qm3x/settings/page";

// 締め状況の判定に使う最小限の型 (closing/page.tsx の ClosingRecord と同じキー・date形式 "YYYY-MM-DD")
interface ClosingRecordLite { date: string }

// 入店ページ (checkin) が使用する来店中リストと同じキー・型を参照する
interface Visit {
  id: string;
  customerId: string | null;
  name: string;
  rank: CustomerRank;
  checkedInAt: string;
  tableId?: string;
  seatIndex?: number;
}

/** 滞在分数を「○時間○分」表記に整形 */
function formatStayDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h > 0 ? `${h}時間${r}分` : `${r}分`;
}

export default function OrdersPage() {
  const [products, setProducts] = usePersisted(productStore);
  const [customers, setCustomers] = usePersisted(customerStore);
  const settings = useStoreSettings();
  const [orders, setOrders] = usePersisted(salesOrderStore);
  const [, setMovements] = usePersisted(stockMovementStore);
  const [, setChipFlow] = usePersisted(chipFlowStore);
  const [visits] = usePersistedState<Visit[]>("v2_visits_v1", []);
  const [timeCharge] = usePersistedState<TimeChargeSettings>(TIME_CHARGE_KEY, DEFAULT_TIME_CHARGE);
  const [closings] = usePersistedState<ClosingRecordLite[]>("v2_closings_v1", []);
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState<string>("");
  const [customer, setCustomer] = useState("");
  const [table, setTable] = useState("");
  const [cart, setCart] = useState<SalesOrderItem[]>([]);
  const [settling, setSettling] = useState<SalesOrder | null>(null);
  const [justSettled, setJustSettled] = useState<SalesOrder | null>(null);
  const [method, setMethod] = useState<"cash" | "card" | "qr" | "credit">("cash");
  const [cat, setCat] = useState<string>("all");
  const { toast, show: showToast } = useToast(4000);

  const active = orders.filter(o => o.status === "active");
  const settled = orders.filter(o => o.status === "settled");
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayClosed = closings.some(c => c.date === todayKey);

  const activeProducts = useMemo(() => products.filter(p => p.active), [products]);
  const cats = useMemo(() => Array.from(new Set(activeProducts.map(p => p.category))), [activeProducts]);
  const filteredProducts = cat === "all" ? activeProducts : activeProducts.filter(p => p.category === cat);

  // 選択中の顧客の来店記録 (最新の checkedInAt を採用)
  const currentVisit = useMemo(() => {
    if (!customerId) return undefined;
    const matches = visits.filter(v => v.customerId === customerId);
    if (matches.length === 0) return undefined;
    return matches.reduce((latest, v) => new Date(v.checkedInAt) > new Date(latest.checkedInAt) ? v : latest);
  }, [visits, customerId]);

  const stayMinutes = currentVisit ? Math.max(0, (Date.now() - new Date(currentVisit.checkedInAt).getTime()) / 60000) : 0;
  const timeChargeAmount = currentVisit ? calcTimeChargeAmount(stayMinutes, timeCharge) : 0;
  const timeChargeUnits = currentVisit ? calcTimeChargeUnits(stayMinutes, timeCharge) : 0;
  const showTimeChargeSuggestion = timeCharge.enabled && !!currentVisit;
  // カート上に既にテーブルチャージ行があるか (手動削除された場合は再追加できるようにする)
  const timeChargeInCart = cart.some(i => i.category === "time_charge");

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
  /** テーブルチャージ候補をカートへ1行追加する (自動追加はしない。スタッフの確認操作) */
  function addTimeCharge() {
    if (!currentVisit || timeChargeInCart) return;
    const label = `テーブルチャージ(${formatStayDuration(stayMinutes)})`;
    setCart(prev => [...prev, {
      productId: `time_charge_${currentVisit.id}_${Date.now()}`,
      name: label, price: timeChargeAmount, qty: 1, category: "time_charge",
    }]);
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
    const now = new Date().toISOString();
    // 1. 注文ステータス
    const settledOrder: SalesOrder = {
      ...s,
      status: "settled" as const,
      settledAt: now,
      paymentMethod: method,
      ...(isCredit ? { unpaid: true } : {}),
    };
    setOrders(prev => prev.map(o => o.id === s.id ? settledOrder : o));
    // 2. 在庫減算 + 在庫移動履歴
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
    // 4. 購入ポイント付与 (後払いは消込時ではなく付与なし。既存顧客紐付きのみ)
    let grantedPoints = 0;
    if (s.customerId && !isCredit) {
      grantedPoints = grantSpendPoints(s.customerId, s.total, `注文精算 (${s.id})`);
    }
    // 5. チップ商品(tip_purchase=貸出/tip_use=回収)の精算 → チップフロー + 顧客チップ残高へ連動
    //    (発生時=精算確定時のみ計上。後払いの消し込み時には再度加算しない)
    const chipItems = s.items.filter(i => i.category === "tip_purchase" || i.category === "tip_use");
    let chipReflected = false;
    if (chipItems.length > 0) {
      const newEntries: ChipFlowEntry[] = chipItems.map(item => {
        const flowDirection: "out" | "in" = item.category === "tip_purchase" ? "out" : "in";
        const signed = flowDirection === "out" ? item.qty : -item.qty;
        return {
          id: `cf${Date.now()}_${item.productId}`,
          date: now.slice(0, 10),
          category: "purchase_cash",
          direction: flowDirection,
          amount: item.qty,
          customer: s.customer,
          customerId: s.customerId,
          flowDirection,
          signedAmount: signed,
          note: "精算連動",
          createdAt: now,
        };
      });
      setChipFlow(prev => [...newEntries, ...prev]);
      if (s.customerId) {
        const totalSigned = newEntries.reduce((sum, e) => sum + (e.signedAmount ?? 0), 0);
        if (totalSigned !== 0) {
          setCustomers(prev => prev.map(c => c.id === s.customerId ? { ...c, chipBalance: c.chipBalance + totalSigned } : c));
        }
      }
      chipReflected = true;
    }
    showToast(`精算が完了しました${grantedPoints > 0 ? ` (${grantedPoints}ptを付与しました)` : ""}${chipReflected ? " (チップ残高に反映しました)" : ""}`);
    setSettling(null);
    setJustSettled(settledOrder);
  }
  function remove(id: string) {
    if (!confirm("削除しますか？")) return;
    setOrders(prev => prev.filter(o => o.id !== id));
  }

  function paymentLabel(m?: string) {
    return m === "cash" ? "現金" : m === "card" ? "カード" : m === "qr" ? "QR" : m === "credit" ? "後払い" : "—";
  }

  /** サーマルレシート幅相当の縦長レシート/領収書を別窓で印刷 (任意操作。自動印刷はしない) */
  function printOrderReceipt(o: SalesOrder, mode: "receipt" | "invoice") {
    printReceipt(
      {
        id: o.id,
        customer: o.customer,
        table: o.table,
        items: o.items.map(i => ({ name: i.name, price: i.price, qty: i.qty })),
        total: o.total,
        createdAt: o.createdAt,
        settledAt: o.settledAt,
      },
      {
        storeName: settings.storeName || DEFAULT_STORE_NAME,
        mode,
        paymentLabel: o.paymentMethod ? paymentLabel(o.paymentMethod) : undefined,
      }
    );
  }

  return (
    <VStack gap={16}>
      <PageHeader
        title="注文・精算"
        sub={`未精算 ${active.length} · 精算済 ${settled.length}`}
        action={<Btn variant="primary" onClick={() => setOpen(true)}><Plus size={14} /> 新規注文</Btn>}
      />

      {toast && <Toast message={toast.message} variant={toast.variant} />}

      {todayClosed && (
        <Banner variant="warn">本日の締め処理は完了しています。これ以降の売上は締め集計に含まれません</Banner>
      )}

      <Panel title="未精算">
        {active.length === 0 ? <Empty>未精算の注文はありません</Empty> : (
          <div className="v2-table-wrap">
            <table className="v2-table">
              <thead><tr><th>顧客</th><th>卓</th><th>商品</th><th className="v2-num-cell">合計</th><th>時刻</th><th></th></tr></thead>
              <tbody>
                {active.map(o => (
                  <tr key={o.id}>
                    <td>{o.customer}</td>
                    <td>{o.table ? <Chip>{o.table}</Chip> : <span className="v2-mute">—</span>}</td>
                    <td className="v2-sub" style={{ fontSize: 12, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={o.items.map(i => `${i.name}×${i.qty}`).join(" / ")}>{o.items.map(i => `${i.name}×${i.qty}`).join(" / ")}</td>
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
          </div>
        )}
      </Panel>

      {settled.length > 0 && (
        <Panel title="精算済み (本日)" action={<span className="v2-mute" style={{ fontSize: 12 }}>{settled.length}件</span>}>
          <div className="v2-table-wrap">
            <table className="v2-table">
              <thead><tr><th>顧客</th><th>商品</th><th className="v2-num-cell">合計</th><th>支払</th><th>時刻</th><th></th></tr></thead>
              <tbody>
                {settled.slice(0, 20).map(o => (
                  <tr key={o.id}>
                    <td>{o.customer}</td>
                    <td className="v2-sub" style={{ fontSize: 12, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={o.items.map(i => `${i.name}×${i.qty}`).join(" / ")}>{o.items.map(i => `${i.name}×${i.qty}`).join(" / ")}</td>
                    <td className="v2-num-cell">¥{o.total.toLocaleString()}</td>
                    <td className="v2-sub">
                      {o.paymentMethod === "credit"
                        ? <Chip variant={o.unpaid ? "warn" : "success"}>{o.unpaid ? "後払い(未払)" : "後払い(消込済)"}</Chip>
                        : paymentLabel(o.paymentMethod)}
                    </td>
                    <td className="v2-num v2-sub">{new Date(o.settledAt ?? o.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</td>
                    <td>
                      <HStack gap={4}>
                        <Btn size="xs" onClick={() => printOrderReceipt(o, "receipt")}><Printer size={11} /> レシート</Btn>
                        <Btn size="xs" variant="ghost" onClick={() => printOrderReceipt(o, "invoice")}><ReceiptIcon size={11} /> 領収書</Btn>
                      </HStack>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          <div className="v2-form-grid">
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
            <Empty>商品マスタが空です。先に <Link href="/k4z8qm3x/products" style={{ textDecoration: "underline" }}>商品マスタ</Link> で商品を登録してください。</Empty>
          ) : (
            <div>
              <div className="v2-toolbar" style={{ marginBottom: 8 }}>
                <FilterChips
                  value={cat}
                  onChange={setCat}
                  items={[{ value: "all", label: "すべて" }, ...cats.map(c => ({ value: c, label: c }))]}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 6 }}>
                {filteredProducts.map(p => (
                  <Btn key={p.id} onClick={() => addToCart(p.id)} style={{ height: 56, flexDirection: "column", padding: 8, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 12 }}>{p.name}</span>
                    <HStack gap={4} style={{ width: "100%" }}>
                      <span className="v2-num v2-mute" style={{ fontSize: 11 }}>¥{p.price.toLocaleString()}</span>
                      {p.stock != null && <span className="v2-mute" style={{ fontSize: 10, marginLeft: "auto" }}>在 {p.stock}</span>}
                    </HStack>
                  </Btn>
                ))}
              </div>
            </div>
          )}

          {showTimeChargeSuggestion && (
            <Banner variant="info" icon={<Clock size={14} style={{ flexShrink: 0 }} />}>
              <HStack gap={10} style={{ width: "100%" }}>
                <span style={{ fontSize: 12, flex: 1 }}>
                  テーブルチャージ: 滞在{formatStayDuration(stayMinutes)} → ¥{timeChargeAmount.toLocaleString()}
                  <span className="v2-mute" style={{ marginLeft: 6 }}>({timeChargeUnits}単位 × ¥{timeCharge.unitPrice.toLocaleString()})</span>
                </span>
                <Btn size="xs" variant={timeChargeInCart ? undefined : "primary"} disabled={timeChargeInCart} onClick={addTimeCharge}>
                  {timeChargeInCart ? "追加済み" : "追加"}
                </Btn>
              </HStack>
            </Banner>
          )}

          {cart.length > 0 && (
            <div>
              <SectionLabel>カート</SectionLabel>
              <div className="v2-table-wrap">
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
                  <Btn key={m} variant={method === m ? "selected" : undefined} onClick={() => setMethod(m)}>
                    {m === "cash" ? "現金" : m === "card" ? "カード" : m === "qr" ? "QR" : "後払い"}
                  </Btn>
                ))}
              </div>
            </Field>
            {method === "credit" && !settling.customerId && (
              <Banner variant="warn">
                この注文は既存顧客に紐付いていません(ゲスト名: {settling.customer})。後日の消し込みのため、可能であれば顧客登録して紐付けてください。
              </Banner>
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

      {/* 精算完了後: レシート/領収書印刷の導線 (任意操作。自動印刷はしない) */}
      <Modal
        open={!!justSettled}
        onClose={() => setJustSettled(null)}
        title="精算が完了しました"
        footer={<Btn onClick={() => setJustSettled(null)}>閉じる</Btn>}
      >
        {justSettled && (
          <VStack gap={16}>
            <div>
              <div className="v2-mute" style={{ fontSize: 12 }}>{justSettled.customer}</div>
              <div className="v2-num" style={{ fontSize: 24, fontWeight: 600 }}>¥{justSettled.total.toLocaleString()}</div>
            </div>
            <div className="v2-mute" style={{ fontSize: 12 }}>必要であればレシート・領収書を印刷してください</div>
            <HStack gap={8}>
              <Btn onClick={() => printOrderReceipt(justSettled, "receipt")}><Printer size={14} /> レシートを印刷</Btn>
              <Btn onClick={() => printOrderReceipt(justSettled, "invoice")}><ReceiptIcon size={14} /> 領収書を印刷</Btn>
            </HStack>
          </VStack>
        )}
      </Modal>
    </VStack>
  );
}
