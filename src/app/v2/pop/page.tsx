"use client";

import { useState } from "react";
import { usePersisted } from "@/lib/persist/store";
import { popStore, type PopRecord } from "@/lib/store/domain-stores";
import { PageHeader, Btn, Panel, Field, Modal, VStack, Chip, Empty } from "@/components/v2/ui";
import { Plus, Trash2 } from "lucide-react";

export default function PopPage() {
  const [pops, setPops] = usePersisted(popStore);
  const [open, setOpen] = useState(false);
  const [d, setD] = useState<Omit<PopRecord, "id" | "createdAt">>({ title: "", body: "", active: true });

  function save() {
    if (!d.title.trim()) return;
    setPops(prev => [{ id: `p${Date.now()}`, createdAt: new Date().toISOString(), ...d }, ...prev]);
    setOpen(false);
    setD({ title: "", body: "", active: true });
  }
  function toggle(id: string) { setPops(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p)); }
  function remove(id: string) { if (confirm("削除？")) setPops(prev => prev.filter(p => p.id !== id)); }

  return (
    <VStack gap={16}>
      <PageHeader title="POP" sub={`${pops.length}件`} action={<Btn variant="primary" onClick={() => setOpen(true)}><Plus size={14}/> 追加</Btn>} />
      <Panel>
        {pops.length === 0 ? <Empty>POPがありません</Empty> : (
          <table className="v2-table">
            <thead><tr><th>タイトル</th><th>本文</th><th>状態</th><th></th></tr></thead>
            <tbody>
              {pops.map(p => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td className="v2-sub" style={{ fontSize: 12 }}>{p.body.slice(0, 80)}</td>
                  <td><button onClick={() => toggle(p.id)} className="v2-btn-ghost"><Chip variant={p.active ? "success" : undefined}>{p.active ? "公開" : "非公開"}</Chip></button></td>
                  <td><Btn size="xs" variant="danger" onClick={() => remove(p.id)}><Trash2 size={11}/></Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Modal open={open} onClose={() => setOpen(false)} title="POP追加" footer={<><Btn onClick={() => setOpen(false)}>キャンセル</Btn><Btn variant="primary" onClick={save}>保存</Btn></>}>
        <VStack gap={12}>
          <Field label="タイトル" required><input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></Field>
          <Field label="本文"><textarea rows={4} value={d.body} onChange={(e) => setD({ ...d, body: e.target.value })} /></Field>
          <Field label="イベント"><input value={d.eventTag ?? ""} onChange={(e) => setD({ ...d, eventTag: e.target.value })} placeholder="紐付けるイベント名 (任意)" /></Field>
        </VStack>
      </Modal>
    </VStack>
  );
}
