"use client";

import { useState, useMemo } from "react";
import { usePersisted, usePersistedState } from "@/lib/persist/store";
import { productStore } from "@/lib/store/domain-stores";
import { stockMovementStore, type StockMovement } from "@/lib/v2/stores";
import { PageHeader, Btn, Panel, Field, Modal, VStack, Chip, Empty, Kpis, Kpi, HStack, Tabs } from "@/components/v2/ui";
import { Plus, Minus, FileDown, AlertTriangle, Pencil, Trash2, ClipboardCheck } from "lucide-react";
import { printDoc, tableHtml, kpisHtml, sectionHtml } from "@/lib/v2/pdf";

type EquipmentCategory = "ゲーム用品" | "家具" | "電子機器" | "消耗品" | "その他";
type EquipmentCondition = "良好" | "劣化あり" | "要交換";

type Equipment = {
  id: string;
  name: string;
  category: EquipmentCategory;
  qty: number;
  condition: EquipmentCondition;
  lastCheckedAt: string; // ISO date
  replaceCycleDays?: number;
  note?: string;
};

const EQUIPMENT_CATEGORIES: EquipmentCategory[] = ["ゲーム用品", "家具", "電子機器", "消耗品", "その他"];
const EQUIPMENT_CONDITIONS: EquipmentCondition[] = ["良好", "劣化あり", "要交換"];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function daysSince(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const diff = Math.floor((new Date(now.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86400000);
  return diff;
}
function conditionVariant(c: EquipmentCondition): "success" | "warn" | "danger" {
  return c === "良好" ? "success" : c === "劣化あり" ? "warn" : "danger";
}
function isOverdue(eq: Equipment) {
  if (eq.replaceCycleDays == null) return false;
  return daysSince(eq.lastCheckedAt) > eq.replaceCycleDays;
}

export default function InventoryPage() {
  const [products, setProducts] = usePersisted(productStore);
  const [movements, setMovements] = usePersisted(stockMovementStore);
  const [equipment, setEquipment] = usePersistedState<Equipment[]>("v2_equipment_v1", []);
  const [tab, setTab] = useState<"stock" | "log" | "equipment">("stock");
  const [open, setOpen] = useState(false);
  const [moveType, setMoveType] = useState<"purchase" | "adjust" | "waste">("purchase");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  // 備品タブ用の状態
  const [eqModalOpen, setEqModalOpen] = useState(false);
  const [editingEq, setEditingEq] = useState<Equipment | null>(null);
  const [eqName, setEqName] = useState("");
  const [eqCategory, setEqCategory] = useState<EquipmentCategory>("ゲーム用品");
  const [eqQty, setEqQty] = useState(1);
  const [eqCondition, setEqCondition] = useState<EquipmentCondition>("良好");
  const [eqLastChecked, setEqLastChecked] = useState(todayStr());
  const [eqReplaceCycle, setEqReplaceCycle] = useState("");
  const [eqNote, setEqNote] = useState("");

  const [inspectTarget, setInspectTarget] = useState<Equipment | null>(null);
  const [inspectCondition, setInspectCondition] = useState<EquipmentCondition>("良好");

  const eqNeedsReplace = useMemo(() => equipment.filter(e => e.condition === "要交換"), [equipment]);
  const eqOverdue = useMemo(() => equipment.filter(e => e.condition !== "要交換" && isOverdue(e)), [equipment]);
  const eqAlerts = [...eqNeedsReplace, ...eqOverdue];

  function resetEqForm() {
    setEqName("");
    setEqCategory("ゲーム用品");
    setEqQty(1);
    setEqCondition("良好");
    setEqLastChecked(todayStr());
    setEqReplaceCycle("");
    setEqNote("");
    setEditingEq(null);
  }

  function openNewEq() {
    resetEqForm();
    setEqModalOpen(true);
  }

  function openEditEq(eq: Equipment) {
    setEditingEq(eq);
    setEqName(eq.name);
    setEqCategory(eq.category);
    setEqQty(eq.qty);
    setEqCondition(eq.condition);
    setEqLastChecked(eq.lastCheckedAt);
    setEqReplaceCycle(eq.replaceCycleDays != null ? String(eq.replaceCycleDays) : "");
    setEqNote(eq.note ?? "");
    setEqModalOpen(true);
  }

  function saveEq() {
    if (!eqName.trim()) return;
    const cycle = eqReplaceCycle.trim() === "" ? undefined : Math.max(0, parseInt(eqReplaceCycle) || 0);
    if (editingEq) {
      setEquipment(prev => prev.map(e => e.id === editingEq.id ? {
        ...e,
        name: eqName.trim(),
        category: eqCategory,
        qty: Math.max(0, eqQty),
        condition: eqCondition,
        lastCheckedAt: eqLastChecked,
        replaceCycleDays: cycle,
        note: eqNote.trim() || undefined,
      } : e));
    } else {
      const item: Equipment = {
        id: `eq${Date.now()}`,
        name: eqName.trim(),
        category: eqCategory,
        qty: Math.max(0, eqQty),
        condition: eqCondition,
        lastCheckedAt: eqLastChecked,
        replaceCycleDays: cycle,
        note: eqNote.trim() || undefined,
      };
      setEquipment(prev => [item, ...prev]);
    }
    setEqModalOpen(false);
    resetEqForm();
  }

  function deleteEq(eq: Equipment) {
    if (!confirm(`「${eq.name}」を削除します。よろしいですか？`)) return;
    setEquipment(prev => prev.filter(e => e.id !== eq.id));
  }

  function openInspect(eq: Equipment) {
    setInspectTarget(eq);
    setInspectCondition(eq.condition);
  }

  function saveInspect() {
    if (!inspectTarget) return;
    setEquipment(prev => prev.map(e => e.id === inspectTarget.id ? {
      ...e,
      condition: inspectCondition,
      lastCheckedAt: todayStr(),
    } : e));
    setInspectTarget(null);
  }

  const tracked = useMemo(() => products.filter(p => p.stock != null), [products]);
  const lowStock = tracked.filter(p => p.minStock != null && (p.stock ?? 0) <= p.minStock);
  const totalValue = tracked.reduce((s, p) => s + (p.stock ?? 0) * (p.cost ?? 0), 0);

  function applyMove() {
    const p = tracked.find(x => x.id === productId);
    if (!p) return;
    if (qty === 0) return;
    if (moveType === "waste" && !confirm(`${p.name} を ${qty}個 廃棄します。よろしいですか？`)) return;
    const delta = moveType === "purchase" ? qty : moveType === "waste" ? -qty : qty; // adjust=入力値そのまま
    const rawStock = (p.stock ?? 0) + delta;
    const newStock = Math.max(0, rawStock);
    if (rawStock < 0 && !confirm(`在庫が0を下回るため0に調整します。よろしいですか？ (計算上: ${rawStock})`)) return;
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, stock: newStock } : x));
    const mv: StockMovement = {
      id: `m${Date.now()}`,
      productId: p.id, productName: p.name,
      delta, reason: moveType, reasonNote: note || undefined,
      balanceAfter: newStock,
      createdAt: new Date().toISOString(),
    };
    setMovements(prev => [mv, ...prev]);
    setOpen(false); setProductId(""); setQty(1); setNote("");
  }

  function exportPDF() {
    const headers = ["商品", "カテゴリ", "在庫", "閾値", "原価", "在庫金額"];
    const rows = tracked.map(p => [
      p.name,
      p.category,
      String(p.stock ?? 0),
      String(p.minStock ?? 0),
      `¥${(p.cost ?? 0).toLocaleString()}`,
      `¥${((p.stock ?? 0) * (p.cost ?? 0)).toLocaleString()}`,
    ]);
    const body = kpisHtml([
      { label: "管理対象", value: `${tracked.length}件` },
      { label: "在庫不足", value: `${lowStock.length}件` },
      { label: "在庫評価額", value: `¥${totalValue.toLocaleString()}` },
      { label: "出力日", value: new Date().toLocaleDateString("ja-JP") },
    ]) + sectionHtml("在庫一覧", tableHtml(headers, rows, { numCols: [2, 3, 4, 5] }));
    printDoc({ title: "在庫リスト", subtitle: new Date().toLocaleDateString("ja-JP"), body, storeName: "てんぽみえるくん" });
  }

  return (
    <VStack gap={16}>
      <PageHeader
        title="在庫管理"
        sub={tab === "equipment"
          ? `登録備品 ${equipment.length}件${eqAlerts.length > 0 ? ` · 要注意 ${eqAlerts.length}件` : ""}`
          : `管理対象 ${tracked.length}件${lowStock.length > 0 ? ` · 在庫不足 ${lowStock.length}件` : ""}`}
        action={
          tab === "equipment" ? (
            <Btn variant="primary" onClick={openNewEq}><Plus size={14}/> 備品登録</Btn>
          ) : (
            <>
              <Btn onClick={exportPDF}><FileDown size={14}/> PDF出力</Btn>
              <Btn variant="primary" onClick={() => setOpen(true)}><Plus size={14}/> 入庫/調整</Btn>
            </>
          )
        }
      />

      {tab !== "equipment" && (
        <Kpis>
          <Kpi label="管理対象" value={tracked.length} sub="件" />
          <Kpi label="在庫不足" value={lowStock.length} sub={lowStock.length > 0 ? "要発注" : "OK"} />
          <Kpi label="在庫評価額" value={`¥${totalValue.toLocaleString()}`} />
          <Kpi label="本日操作" value={movements.filter(m => m.createdAt.startsWith(new Date().toISOString().slice(0,10))).length} sub="件" />
        </Kpis>
      )}

      {tab === "equipment" && (
        <Kpis>
          <Kpi label="登録備品" value={equipment.length} sub="件" />
          <Kpi label="要交換" value={eqNeedsReplace.length} sub={eqNeedsReplace.length > 0 ? "要対応" : "OK"} />
          <Kpi label="点検期限超過" value={eqOverdue.length} sub={eqOverdue.length > 0 ? "要点検" : "OK"} />
          <Kpi label="要注意合計" value={eqAlerts.length} />
        </Kpis>
      )}

      {tab !== "equipment" && lowStock.length > 0 && (
        <Panel>
          <HStack gap={8} style={{ color: "var(--v2-danger)" }}>
            <AlertTriangle size={16} />
            <strong>在庫不足:</strong>
            <span>{lowStock.map(p => `${p.name}(${p.stock})`).join(" / ")}</span>
          </HStack>
        </Panel>
      )}

      {tab === "equipment" && eqAlerts.length > 0 && (
        <Panel>
          <VStack gap={6}>
            <HStack gap={8} style={{ color: "var(--v2-danger)" }}>
              <AlertTriangle size={16} />
              <strong>備品アラート:</strong>
            </HStack>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {eqNeedsReplace.map(e => (
                <Chip key={e.id} variant="danger">{e.name}: 要交換</Chip>
              ))}
              {eqOverdue.map(e => (
                <Chip key={e.id} variant="warn">{e.name}: 点検期限超過 ({daysSince(e.lastCheckedAt)}日経過 / 目安{e.replaceCycleDays}日)</Chip>
              ))}
            </div>
          </VStack>
        </Panel>
      )}

      <Tabs value={tab} onChange={(v) => setTab(v as typeof tab)} items={[
        { value: "stock", label: "在庫一覧" },
        { value: "log", label: `操作履歴 (${movements.length})` },
        { value: "equipment", label: `備品 (${equipment.length})` },
      ]} />

      {tab === "stock" && (
        <Panel>
          {tracked.length === 0 ? <Empty>在庫管理対象がありません。商品マスタで「在庫を管理する」をONにしてください</Empty> : (
            <table className="v2-table">
              <thead><tr><th>商品</th><th>カテゴリ</th><th className="v2-num-cell">在庫</th><th className="v2-num-cell">閾値</th><th className="v2-num-cell">原価</th><th className="v2-num-cell">在庫評価</th><th>状態</th></tr></thead>
              <tbody>
                {tracked.map(p => {
                  const low = p.minStock != null && (p.stock ?? 0) <= p.minStock;
                  return (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td className="v2-mute">{p.category}</td>
                      <td className="v2-num-cell">{p.stock}</td>
                      <td className="v2-num-cell v2-sub">{p.minStock ?? "—"}</td>
                      <td className="v2-num-cell v2-sub">¥{(p.cost ?? 0).toLocaleString()}</td>
                      <td className="v2-num-cell">¥{((p.stock ?? 0) * (p.cost ?? 0)).toLocaleString()}</td>
                      <td>{low ? <Chip variant="danger">不足</Chip> : <Chip variant="success">充分</Chip>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Panel>
      )}

      {tab === "log" && (
        <Panel>
          {movements.length === 0 ? <Empty>操作履歴はありません</Empty> : (
            <table className="v2-table">
              <thead><tr><th>日時</th><th>商品</th><th>種別</th><th className="v2-num-cell">増減</th><th className="v2-num-cell">残</th><th>備考</th></tr></thead>
              <tbody>
                {movements.slice(0, 100).map(m => (
                  <tr key={m.id}>
                    <td className="v2-num v2-sub">{new Date(m.createdAt).toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                    <td>{m.productName}</td>
                    <td className="v2-mute">{m.reason === "purchase" ? "入庫" : m.reason === "sold" ? "販売" : m.reason === "waste" ? "廃棄" : "調整"}</td>
                    <td className="v2-num-cell" style={{ color: m.delta >= 0 ? "var(--v2-success)" : "var(--v2-danger)" }}>{m.delta > 0 ? "+" : ""}{m.delta}</td>
                    <td className="v2-num-cell">{m.balanceAfter}</td>
                    <td className="v2-sub" style={{ fontSize: 12 }}>{m.reasonNote ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      )}

      {tab === "equipment" && (
        <Panel>
          {equipment.length === 0 ? <Empty>登録された備品がありません。「備品登録」から追加してください</Empty> : (
            <table className="v2-table">
              <thead>
                <tr>
                  <th>名前</th>
                  <th>カテゴリ</th>
                  <th className="v2-num-cell">数量</th>
                  <th>状態</th>
                  <th>最終点検日</th>
                  <th className="v2-num-cell">経過日数</th>
                  <th className="v2-num-cell">交換目安</th>
                  <th>メモ</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {equipment.map(e => {
                  const elapsed = daysSince(e.lastCheckedAt);
                  const overdue = isOverdue(e);
                  return (
                    <tr key={e.id}>
                      <td>{e.name}</td>
                      <td className="v2-mute">{e.category}</td>
                      <td className="v2-num-cell">{e.qty}</td>
                      <td><Chip variant={conditionVariant(e.condition)}>{e.condition}</Chip></td>
                      <td className="v2-sub">{e.lastCheckedAt}</td>
                      <td className="v2-num-cell" style={{ color: overdue ? "var(--v2-danger)" : undefined }}>{elapsed}日</td>
                      <td className="v2-num-cell v2-sub">{e.replaceCycleDays != null ? `${e.replaceCycleDays}日` : "—"}</td>
                      <td className="v2-sub" style={{ fontSize: 12 }}>{e.note ?? "—"}</td>
                      <td>
                        <HStack gap={4}>
                          <Btn size="xs" onClick={() => openInspect(e)}><ClipboardCheck size={12}/> 点検</Btn>
                          <Btn size="xs" onClick={() => openEditEq(e)}><Pencil size={12}/></Btn>
                          <Btn size="xs" variant="danger" onClick={() => deleteEq(e)}><Trash2 size={12}/></Btn>
                        </HStack>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Panel>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="入庫 / 在庫調整"
        footer={<><Btn onClick={() => setOpen(false)}>キャンセル</Btn><Btn variant="primary" onClick={applyMove} disabled={!productId || qty === 0}>反映</Btn></>}
      >
        <VStack gap={16}>
          <Field label="種別">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {(["purchase", "adjust", "waste"] as const).map(t => (
                <button key={t} onClick={() => setMoveType(t)} className={`v2-btn ${moveType === t ? "v2-btn-primary" : ""}`}>
                  {t === "purchase" ? "入庫" : t === "adjust" ? "調整" : "廃棄"}
                </button>
              ))}
            </div>
          </Field>
          <Field label="商品" required>
            <select value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">— 選択 —</option>
              {tracked.map(p => <option key={p.id} value={p.id}>{p.name} (現在: {p.stock})</option>)}
            </select>
          </Field>
          <Field label={moveType === "adjust" ? "増減 (マイナス可)" : "数量"}>
            <input type="number" value={qty} onChange={(e) => setQty(parseInt(e.target.value) || 0)} />
          </Field>
          <Field label="備考"><textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="納品書番号 / 理由など" /></Field>
        </VStack>
      </Modal>

      <Modal
        open={eqModalOpen}
        onClose={() => { setEqModalOpen(false); resetEqForm(); }}
        title={editingEq ? "備品を編集" : "備品を登録"}
        footer={<><Btn onClick={() => { setEqModalOpen(false); resetEqForm(); }}>キャンセル</Btn><Btn variant="primary" onClick={saveEq} disabled={!eqName.trim()}>保存</Btn></>}
      >
        <VStack gap={16}>
          <Field label="名前" required>
            <input value={eqName} onChange={(e) => setEqName(e.target.value)} placeholder="例: トランプ、チップセット、ディーラーボタン" />
          </Field>
          <Field label="カテゴリ">
            <select value={eqCategory} onChange={(e) => setEqCategory(e.target.value as EquipmentCategory)}>
              {EQUIPMENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="数量">
            <input type="number" value={eqQty} onChange={(e) => setEqQty(parseInt(e.target.value) || 0)} />
          </Field>
          <Field label="状態">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {EQUIPMENT_CONDITIONS.map(c => (
                <button key={c} onClick={() => setEqCondition(c)} className={`v2-btn ${eqCondition === c ? "v2-btn-primary" : ""}`}>
                  {c}
                </button>
              ))}
            </div>
          </Field>
          <Field label="最終点検日">
            <input type="date" value={eqLastChecked} onChange={(e) => setEqLastChecked(e.target.value)} />
          </Field>
          <Field label="交換目安 (日数・任意)" hint="最終点検日からの経過日数がこれを超えるとアラート表示されます">
            <input type="number" value={eqReplaceCycle} onChange={(e) => setEqReplaceCycle(e.target.value)} placeholder="例: 180" />
          </Field>
          <Field label="メモ"><textarea rows={2} value={eqNote} onChange={(e) => setEqNote(e.target.value)} placeholder="購入先・保管場所など" /></Field>
        </VStack>
      </Modal>

      <Modal
        open={!!inspectTarget}
        onClose={() => setInspectTarget(null)}
        title={`点検: ${inspectTarget?.name ?? ""}`}
        footer={<><Btn onClick={() => setInspectTarget(null)}>キャンセル</Btn><Btn variant="primary" onClick={saveInspect}>点検を記録</Btn></>}
      >
        <VStack gap={16}>
          <Field label="状態を選択">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {EQUIPMENT_CONDITIONS.map(c => (
                <button key={c} onClick={() => setInspectCondition(c)} className={`v2-btn ${inspectCondition === c ? "v2-btn-primary" : ""}`}>
                  {c}
                </button>
              ))}
            </div>
          </Field>
          <div className="v2-sub" style={{ fontSize: 12 }}>最終点検日は本日({todayStr()})に更新されます</div>
        </VStack>
      </Modal>
    </VStack>
  );
}
