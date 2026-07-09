"use client";

import { useState } from "react";
import { usePersisted } from "@/lib/persist/store";
import { pointRuleStore, type PointRuleRecord, type PointRuleKind } from "@/lib/store/domain-stores";
import { toHalfWidthNumber } from "@/lib/v2/points";
import { PageHeader, Btn, Panel, Field, Modal, VStack, Chip, Empty } from "@/components/v2/ui";
import { Plus, Trash2, Pencil } from "lucide-react";

const KIND_LABEL: Record<PointRuleKind, string> = { visit: "来店ごと", spend: "利用額ごと", memo: "メモのみ" };

function autoCondition(d: Omit<PointRuleRecord, "id">): string {
  if (d.kind === "visit") return `来店1回につき${d.points}pt`;
  if (d.kind === "spend") return `¥${(d.spendUnit ?? 0).toLocaleString()}利用ごとに${d.points}pt`;
  return d.conditionText;
}

const DEFAULT_DRAFT: Omit<PointRuleRecord, "id"> = { name: "", points: 100, conditionText: "来店時", isActive: true, priority: 100, kind: "visit", spendUnit: 1000 };

export default function PointRulesPage() {
  const [rules, setRules] = usePersisted(pointRuleStore);
  const [editing, setEditing] = useState<PointRuleRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [d, setD] = useState<Omit<PointRuleRecord, "id">>(DEFAULT_DRAFT);

  function openCreate() {
    setD({ ...DEFAULT_DRAFT });
    setCreating(true);
  }
  function openEdit(r: PointRuleRecord) {
    setD({ ...r, kind: r.kind ?? "memo" });
    setEditing(r);
  }
  function save() {
    if (!d.name.trim()) return;
    const next: Omit<PointRuleRecord, "id"> = { ...d, conditionText: d.kind === "memo" ? d.conditionText : autoCondition(d) };
    if (editing) setRules(prev => prev.map(r => r.id === editing.id ? { ...r, ...next } : r));
    else setRules(prev => [...prev, { id: `r${Date.now()}`, ...next }].sort((a,b) => b.priority - a.priority));
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
            <thead><tr><th>優先度</th><th>ルール</th><th>種別</th><th>条件</th><th className="v2-num-cell">加算</th><th>状態</th><th></th></tr></thead>
            <tbody>
              {rules.map(r => (
                <tr key={r.id}>
                  <td className="v2-num v2-sub">{r.priority}</td>
                  <td>{r.name}{r.description && <div className="v2-mute" style={{ fontSize: 11 }}>{r.description}</div>}</td>
                  <td><Chip variant={(r.kind ?? "memo") === "memo" ? undefined : "success"}>{KIND_LABEL[r.kind ?? "memo"]}</Chip></td>
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
          <Field label="種別" required>
            <select value={d.kind ?? "memo"} onChange={(e) => setD({ ...d, kind: e.target.value as PointRuleKind })}>
              <option value="visit">来店1回につき○pt (自動計算)</option>
              <option value="spend">利用額○円ごとに○pt (自動計算)</option>
              <option value="memo">メモのみ (自動計算しない)</option>
            </select>
          </Field>

          {d.kind === "visit" && (
            <Field label="来店1回あたりの加算ポイント">
              <input inputMode="numeric" value={d.points} onChange={(e) => setD({ ...d, points: toHalfWidthNumber(e.target.value) })} placeholder="例: 100" />
            </Field>
          )}

          {d.kind === "spend" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="利用額の単位(円)"><input inputMode="numeric" value={d.spendUnit ?? 0} onChange={(e) => setD({ ...d, spendUnit: toHalfWidthNumber(e.target.value) })} placeholder="例: 1000" /></Field>
              <Field label="単位ごとの加算ポイント"><input inputMode="numeric" value={d.points} onChange={(e) => setD({ ...d, points: toHalfWidthNumber(e.target.value) })} placeholder="例: 50" /></Field>
            </div>
          )}

          {(d.kind === "visit" || d.kind === "spend") && (
            <div className="v2-mute" style={{ fontSize: 11 }}>自動計算される条件: {autoCondition(d)}</div>
          )}

          {d.kind === "memo" && (
            <Field label="条件(メモ)"><input value={d.conditionText} onChange={(e) => setD({ ...d, conditionText: e.target.value })} placeholder="例: イベント参加" /></Field>
          )}

          <Field label="優先度"><input inputMode="numeric" value={d.priority} onChange={(e) => setD({ ...d, priority: toHalfWidthNumber(e.target.value) })} /></Field>
          <label className="v2-row" style={{ gap: 6 }}><input type="checkbox" checked={d.isActive} onChange={(e) => setD({ ...d, isActive: e.target.checked })} style={{ width: 14, height: 14 }}/> 有効にする</label>
        </VStack>
      </Modal>
    </VStack>
  );
}
