"use client";

import { useState } from "react";
import { usePersisted } from "@/lib/persist/store";
import { eventStore, type EventRecord } from "@/lib/store/domain-stores";
import { PageHeader, Btn, Panel, Field, Modal, VStack, Chip, Empty } from "@/components/v2/ui";
import { Plus, Trash2, Pencil } from "lucide-react";

export default function EventsPage() {
  const [events, setEvents] = usePersisted(eventStore);
  const [editing, setEditing] = useState<EventRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [d, setD] = useState<Omit<EventRecord, "id" | "createdAt" | "reservedCount">>({ title: "", category: "tournament", date: "", time: "", capacity: 30, status: "draft" });

  function openCreate() {
    setD({ title: "", category: "tournament", date: "", time: "", capacity: 30, status: "draft" });
    setCreating(true);
  }
  function openEdit(e: EventRecord) {
    setD({ title: e.title, category: e.category, date: e.date, time: e.time, capacity: e.capacity, status: e.status, fee: e.fee, note: e.note });
    setEditing(e);
  }
  function save() {
    if (!d.title.trim() || !d.date) return;
    if (editing) {
      if (d.capacity < editing.reservedCount) {
        alert(`定員を予約数(${editing.reservedCount}件)未満にはできません`);
        return;
      }
      setEvents(prev => prev.map(e => e.id === editing.id ? { ...e, ...d } : e));
      setEditing(null);
    } else {
      setEvents(prev => [{ id: `e${Date.now()}`, createdAt: new Date().toISOString(), reservedCount: 0, ...d }, ...prev]);
      setCreating(false);
    }
  }
  function remove(id: string) {
    const e = events.find(ev => ev.id === id);
    const message = e && e.reservedCount > 0
      ? `このイベントには予約${e.reservedCount}件があります。\n削除すると予約情報も失われます。\n\n削除しますか？`
      : "削除しますか？";
    if (!confirm(message)) return;
    setEvents(prev => prev.filter(e => e.id !== id));
  }

  return (
    <VStack gap={16}>
      <PageHeader
        title="イベント"
        sub={`${events.length}件`}
        action={<Btn variant="primary" onClick={openCreate}><Plus size={14} /> 新規</Btn>}
      />
      <Panel>
        {events.length === 0 ? <Empty>イベントがありません</Empty> : (
          <table className="v2-table">
            <thead><tr><th>タイトル</th><th>カテゴリ</th><th>日時</th><th className="v2-num-cell">定員/予約</th><th>状態</th><th></th></tr></thead>
            <tbody>
              {events.map(e => (
                <tr key={e.id}>
                  <td>{e.title}</td>
                  <td className="v2-sub">{e.category === "tournament" ? "トナメ" : e.category === "party" ? "パーティ" : "キャンペーン"}</td>
                  <td className="v2-num">{e.date} {e.time}</td>
                  <td className="v2-num-cell">{e.reservedCount} / {e.capacity}</td>
                  <td><Chip variant={e.status === "open" ? "success" : e.status === "closed" ? undefined : "warn"}>{e.status === "draft" ? "下書き" : e.status === "open" ? "公開" : "終了"}</Chip></td>
                  <td>
                    <Btn size="xs" onClick={() => openEdit(e)}><Pencil size={11} /></Btn>{" "}
                    <Btn size="xs" variant="danger" onClick={() => remove(e.id)}><Trash2 size={11} /></Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Modal
        open={creating || editing !== null}
        onClose={() => { setCreating(false); setEditing(null); }}
        title={editing ? "イベント編集" : "イベント新規"}
        footer={<><Btn onClick={() => { setCreating(false); setEditing(null); }}>キャンセル</Btn><Btn variant="primary" onClick={save}>保存</Btn></>}
      >
        <VStack gap={16}>
          <Field label="タイトル" required><input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="カテゴリ">
              <select value={d.category} onChange={(e) => setD({ ...d, category: e.target.value as EventRecord["category"] })}>
                <option value="tournament">トナメ</option><option value="party">パーティ</option><option value="campaign">キャンペーン</option>
              </select>
            </Field>
            <Field label="状態">
              <select value={d.status} onChange={(e) => setD({ ...d, status: e.target.value as EventRecord["status"] })}>
                <option value="draft">下書き</option><option value="open">公開</option><option value="closed">終了</option>
              </select>
            </Field>
            <Field label="日付" required><input type="date" value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} /></Field>
            <Field label="時間"><input value={d.time} onChange={(e) => setD({ ...d, time: e.target.value })} placeholder="20:00-23:00" /></Field>
            <Field label="定員" hint={editing && editing.reservedCount > 0 ? `予約数 ${editing.reservedCount}件未満にはできません` : undefined}>
              <input type="number" min={editing?.reservedCount ?? 0} value={d.capacity} onChange={(e) => setD({ ...d, capacity: parseInt(e.target.value) || 0 })} />
            </Field>
            <Field label="参加費"><input type="number" value={d.fee ?? 0} onChange={(e) => setD({ ...d, fee: parseInt(e.target.value) || 0 })} /></Field>
          </div>
          <Field label="備考"><textarea rows={2} value={d.note ?? ""} onChange={(e) => setD({ ...d, note: e.target.value })} /></Field>
        </VStack>
      </Modal>
    </VStack>
  );
}
