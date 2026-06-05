"use client";

import { useState } from "react";
import { usePersisted } from "@/lib/persist/store";
import { productStore, type ProductRecord, type ProductCategory } from "@/lib/store/domain-stores";
import { PageHeader, Btn, Panel, Field, Modal, VStack, HStack, Chip, Empty } from "@/components/v2/ui";
import { Plus, Pencil, Trash2 } from "lucide-react";

const CATEGORY_LABEL: Record<ProductCategory, string> = {
  entrance: "エントランス", drink: "ドリンク", food: "フード",
  tournament_fee: "トナメ参加費", tip_purchase: "チップ購入",
  tip_use: "チップ利用", discount: "割引", adjustment: "調整", other: "その他",
};

export default function ProductsPage() {
  const [products, setProducts] = usePersisted(productStore);
  const [editing, setEditing] = useState<ProductRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Omit<ProductRecord, "id" | "createdAt">>({ name: "", price: 0, category: "drink", active: true });

  function openCreate() {
    setDraft({ name: "", price: 0, category: "drink", active: true });
    setCreating(true);
  }
  function openEdit(p: ProductRecord) {
    setDraft({ name: p.name, price: p.price, category: p.category, active: p.active });
    setEditing(p);
  }
  function save() {
    if (!draft.name.trim()) return;
    if (editing) {
      setProducts(prev => prev.map(p => p.id === editing.id ? { ...p, ...draft } : p));
      setEditing(null);
    } else {
      setProducts(prev => [{ id: `p${Date.now()}`, createdAt: new Date().toISOString(), ...draft }, ...prev]);
      setCreating(false);
    }
  }
  function toggleActive(id: string) {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  }
  function remove(id: string) {
    if (!confirm("削除しますか？")) return;
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  const modalOpen = creating || editing !== null;
  function closeModal() { setCreating(false); setEditing(null); }

  return (
    <VStack gap={16}>
      <PageHeader
        title="商品マスタ"
        sub={`${products.length}件 (販売中 ${products.filter(p => p.active).length})`}
        action={<Btn variant="primary" onClick={openCreate}><Plus size={14} /> 追加</Btn>}
      />

      <div className="v2-panel">
        <table className="v2-table">
          <thead>
            <tr>
              <th>商品名</th>
              <th>カテゴリ</th>
              <th className="v2-num-cell">価格</th>
              <th>状態</th>
              <th style={{ width: 120 }}></th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan={5}><Empty>商品がありません</Empty></td></tr>
            ) : products.map(p => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td className="v2-sub">{CATEGORY_LABEL[p.category]}</td>
                <td className="v2-num-cell">¥{p.price.toLocaleString()}</td>
                <td>
                  <button onClick={() => toggleActive(p.id)} className="v2-btn-ghost" style={{ padding: 0 }}>
                    <Chip variant={p.active ? "success" : undefined}>{p.active ? "販売中" : "停止"}</Chip>
                  </button>
                </td>
                <td>
                  <HStack gap={4}>
                    <Btn size="xs" onClick={() => openEdit(p)}><Pencil size={11} /></Btn>
                    <Btn size="xs" variant="danger" onClick={() => remove(p.id)}><Trash2 size={11} /></Btn>
                  </HStack>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "商品編集" : "商品追加"}
        footer={<><Btn onClick={closeModal}>キャンセル</Btn><Btn variant="primary" onClick={save}>保存</Btn></>}
      >
        <VStack gap={16}>
          <Field label="商品名" required><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
          <Field label="価格 (円)"><input type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: parseInt(e.target.value) || 0 })} /></Field>
          <Field label="カテゴリ">
            <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as ProductCategory })}>
              {(Object.keys(CATEGORY_LABEL) as ProductCategory[]).map(c => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </select>
          </Field>
          <label className="v2-row" style={{ gap: 6 }}>
            <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} style={{ width: 14, height: 14 }} />
            販売中にする
          </label>
        </VStack>
      </Modal>
    </VStack>
  );
}
