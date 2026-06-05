"use client";

import { useState } from "react";
import { usePersisted } from "@/lib/persist/store";
import { pointRuleStore, type PointRuleRecord } from "@/lib/store/domain-stores";
import { PageHeader, Btn, Panel, Field, Modal, VStack, Chip, Empty } from "@/components/v2/ui";
import { Plus, Trash2, Pencil } from "lucide-react";

export default function PointRulesPage() {
  const [rules, setRules] = usePersisted(pointRuleStore);
  const [editing, setEditing] = useState<PointRuleRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [d, setD] = useState<Omit<PointRuleRecord, "id">>({ name: "", points: 100, conditionText: "来店時", isActive: true, priority: 100 });

  function openCreate() {
    setD({ name: "", points: 100, conditionText: "来店時", isActive: true, priority: 100 });
    setCreating(true);
  }
  function openEdit(r: PointRuleRecord) {
    setD({ ...r });
    setEditing(r);
  }
  function save() {
    if (!d.name.trim()) return;
    if (editing) setRules(prev => prev.map(r => r.id === editing.id ? { ...r, ...d } : r));
    else setRules(prev => [...prev, { id: `r${Date.now()}`, ...d }].sort((a,b) => b.priority - a.priority));
    setCreating(false); setEditing(null);
  }
  function toggle(id: string) { setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r)); }
  function remove(id: string) { if (confirm("削除？")) setRules(prev => prev.filter(r => r.id !== id)); }

  return (
    <VStack gap={16}>
      <PageHeader title="ポイントルール" sub={`${rules.length}件`} action={<Btn variant="primary" onClick={openCreate}><Plus size={14}/> 追加</Btn>} />
      <Panel>
        {rules.length === 0 ? <Empty>ルールがありません</Empty> : (
          <table className="v2-table">
            <thead><tr><th>優先度</th><th>ルール</th><th>条件</th><th className="v2-num-cell">加算</th><th>状態</th><th></th></tr></thead>
            <tbody>
              {rules.map(r => (
                <tr key={r.id}>
                  <td className="v2-num v2-sub">{r.priority}</td>
                  <td>{r.name}{r.description && <div className="v2-mute" style={{ fontSize: 11 }}>{r.description}</div>}</td>
                  <td className="v2-sub" style={{ fontFamily: "var(--v2-num)", fontSize: 12 }}>{r.conditionText}</td>
                  <td className="v2-num-cell">+{r.points}</td>
                  <td><button onClick={() => toggle(r.id)} className="v2-btn-ghost" style={{ padding: 0 }}><Chip variant={r.isActive ? "success" : undefined}>{r.isActive ? "有効" : "停止"}</Chip></button></td>
                  <td><Btn size="xs" onClick={() => openEdit(r)}><Pencil size={11}/></Btn>{" "}<Btn size="xs" variant="danger" onClick={() => remove(r.id)}><Trash2 size={11}/></Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Modal open={creating || editing !== null} onClose={() => { setCreating(false); setEditing(null); }}
        title={editing ? "編集" : "新規"}
        footer={<><Btn onClick={() => { setCreating(false); setEditing(null); }}>キャンセル</Btn><Btn variant="primary" onClick={save}>保存</Btn></>}>
        <VStack gap={12}>
          <Field label="ルール名" required><input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></Field>
          <Field label="条件" required><input value={d.conditionText} onChange={(e) => setD({ ...d, conditionText: e.target.value })} placeholder="来店時" /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="加算ポイント"><input type="number" value={d.points} onChange={(e) => setD({ ...d, points: parseInt(e.target.value) || 0 })} /></Field>
            <Field label="優先度"><input type="number" value={d.priority} onChange={(e) => setD({ ...d, priority: parseInt(e.target.value) || 0 })} /></Field>
          </div>
          <label className="v2-row" style={{ gap: 6 }}><input type="checkbox" checked={d.isActive} onChange={(e) => setD({ ...d, isActive: e.target.checked })} style={{ width: 14, height: 14 }}/> 有効にする</label>
        </VStack>
      </Modal>
    </VStack>
  );
}
