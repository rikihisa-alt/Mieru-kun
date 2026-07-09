"use client";

import { useState, useMemo } from "react";
import { usePersisted } from "@/lib/persist/store";
import { productStore } from "@/lib/store/domain-stores";
import { stockMovementStore, type StockMovement } from "@/lib/v2/stores";
import { PageHeader, Btn, Panel, Field, Modal, VStack, Chip, Empty, Kpis, Kpi, HStack, Tabs } from "@/components/v2/ui";
import { Plus, Minus, FileDown, AlertTriangle } from "lucide-react";
import { printDoc, tableHtml, kpisHtml, sectionHtml } from "@/lib/v2/pdf";

export default function InventoryPage() {
  const [products, setProducts] = usePersisted(productStore);
  const [movements, setMovements] = usePersisted(stockMovementStore);
  const [tab, setTab] = useState<"stock" | "log">("stock");
  const [open, setOpen] = useState(false);
  const [moveType, setMoveType] = useState<"purchase" | "adjust" | "waste">("purchase");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

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
        sub={`管理対象 ${tracked.length}件${lowStock.length > 0 ? ` · 在庫不足 ${lowStock.length}件` : ""}`}
        action={
          <>
            <Btn onClick={exportPDF}><FileDown size={14}/> PDF出力</Btn>
            <Btn variant="primary" onClick={() => setOpen(true)}><Plus size={14}/> 入庫/調整</Btn>
          </>
        }
      />

      <Kpis>
        <Kpi label="管理対象" value={tracked.length} sub="件" />
        <Kpi label="在庫不足" value={lowStock.length} sub={lowStock.length > 0 ? "要発注" : "OK"} />
        <Kpi label="在庫評価額" value={`¥${totalValue.toLocaleString()}`} />
        <Kpi label="本日操作" value={movements.filter(m => m.createdAt.startsWith(new Date().toISOString().slice(0,10))).length} sub="件" />
      </Kpis>

      {lowStock.length > 0 && (
        <Panel>
          <HStack gap={8} style={{ color: "var(--v2-danger)" }}>
            <AlertTriangle size={16} />
            <strong>在庫不足:</strong>
            <span>{lowStock.map(p => `${p.name}(${p.stock})`).join(" / ")}</span>
          </HStack>
        </Panel>
      )}

      <Tabs value={tab} onChange={(v) => setTab(v as typeof tab)} items={[
        { value: "stock", label: "在庫一覧" },
        { value: "log", label: `操作履歴 (${movements.length})` },
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
    </VStack>
  );
}
