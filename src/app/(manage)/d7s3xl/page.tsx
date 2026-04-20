"use client";

import { useState } from "react";
import { Plus, Calendar, Users, Pencil, Trash2, Eye, EyeOff, X } from "lucide-react";

interface EventItem {
  id: string;
  title: string;
  description: string;
  startsAt: string;       // datetime-local
  endsAt: string;
  capacity: number;
  reservedCount: number;
  deadline: string;
  isPublic: boolean;
}

const INIT: EventItem[] = [
  { id: "ev1", title: "春のVIPナイト", description: "VIP会員限定のスペシャルナイト", startsAt: "2026-04-25T20:00", endsAt: "2026-04-26T02:00", capacity: 30, reservedCount: 18, deadline: "2026-04-24T18:00", isPublic: true },
  { id: "ev2", title: "ホールデム・ウィークエンドトーナメント", description: "エントリー3,000円・プライズ合計50,000円", startsAt: "2026-04-27T19:00", endsAt: "2026-04-27T23:00", capacity: 40, reservedCount: 25, deadline: "2026-04-27T18:00", isPublic: true },
  { id: "ev3", title: "新作カクテル試飲会", description: "限定10名・要予約", startsAt: "2026-05-02T22:00", endsAt: "2026-05-02T23:00", capacity: 10, reservedCount: 3, deadline: "2026-05-01T20:00", isPublic: false },
];

const EMPTY: Omit<EventItem, "id" | "reservedCount"> = {
  title: "", description: "", startsAt: "", endsAt: "", capacity: 20, deadline: "", isPublic: true,
};

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>(INIT);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<typeof EMPTY>(EMPTY);

  function startCreate() {
    setDraft(EMPTY);
    setCreating(true);
  }

  function startEdit(e: EventItem) {
    setEditing(e);
    setDraft({ title: e.title, description: e.description, startsAt: e.startsAt, endsAt: e.endsAt, capacity: e.capacity, deadline: e.deadline, isPublic: e.isPublic });
  }

  function save() {
    if (!draft.title.trim()) return;
    if (editing) {
      setEvents((p) => p.map((e) => (e.id === editing.id ? { ...e, ...draft } : e)));
      setEditing(null);
    } else {
      setEvents((p) => [...p, { id: `ev${Date.now()}`, reservedCount: 0, ...draft }]);
      setCreating(false);
    }
  }

  function togglePublic(id: string) {
    setEvents((p) => p.map((e) => (e.id === id ? { ...e, isPublic: !e.isPublic } : e)));
  }
  function deleteEvent(id: string) {
    if (!window.confirm("削除しますか？")) return;
    setEvents((p) => p.filter((e) => e.id !== id));
  }

  const showModal = creating || editing !== null;

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-secondary">{events.length} 件のイベント</p>
        <button onClick={startCreate} className="flex items-center gap-1 px-3 py-[7px] bg-accent text-white text-[13px] font-medium rounded-[var(--radius)] hover:bg-accent-hover transition-colors">
          <Plus className="w-3.5 h-3.5" />イベント追加
        </button>
      </div>

      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border-light">
            <th className="px-3 py-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-left">タイトル</th>
            <th className="px-3 py-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-left">日時</th>
            <th className="px-3 py-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-left">受付締切</th>
            <th className="px-3 py-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-left">予約</th>
            <th className="px-3 py-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-left">公開</th>
            <th className="px-3 py-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-left">操作</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => {
            const pct = e.capacity > 0 ? (e.reservedCount / e.capacity) * 100 : 0;
            return (
              <tr key={e.id} className="border-b border-border-light hover:bg-bg-hover">
                <td className="px-3 py-2.5">
                  <div className="font-medium text-text-primary">{e.title}</div>
                  <div className="text-[11px] text-text-tertiary truncate max-w-[260px]">{e.description}</div>
                </td>
                <td className="px-3 py-2.5 text-text-secondary text-[12px]">
                  <Calendar className="w-3 h-3 inline mr-1 text-text-tertiary" />
                  {e.startsAt.slice(5, 10)} {e.startsAt.slice(11, 16)} 〜 {e.endsAt.slice(11, 16)}
                </td>
                <td className="px-3 py-2.5 text-text-secondary text-[12px]">{e.deadline.slice(5, 10)} {e.deadline.slice(11, 16)}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-text-tertiary" />
                    <span className="font-medium text-text-primary">{e.reservedCount}/{e.capacity}</span>
                    <div className="h-1 bg-bg-hover rounded-full overflow-hidden w-16">
                      <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <button onClick={() => togglePublic(e.id)} className="flex items-center gap-1 text-[11px] text-text-secondary hover:bg-bg-hover px-2 py-1 rounded-[var(--radius-sm)]">
                    {e.isPublic ? <><Eye className="w-3 h-3 text-accent" />公開中</> : <><EyeOff className="w-3 h-3" />非公開</>}
                  </button>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(e)} className="p-1 hover:bg-bg-hover rounded text-text-secondary"><Pencil className="w-3 h-3" /></button>
                    <button onClick={() => deleteEvent(e.id)} className="p-1 hover:bg-status-danger-bg rounded text-status-danger"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4" onClick={() => { setCreating(false); setEditing(null); }}>
          <div className="bg-bg-white rounded-[var(--radius-lg)] w-full max-w-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(ev) => ev.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold">{editing ? "イベント編集" : "イベント追加"}</h3>
              <button onClick={() => { setCreating(false); setEditing(null); }} className="p-1 hover:bg-bg-hover rounded"><X className="w-4 h-4 text-text-tertiary" /></button>
            </div>
            <div className="space-y-3">
              <Field label="タイトル" required>
                <input type="text" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="春のVIPナイト" />
              </Field>
              <Field label="説明">
                <textarea rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="resize-none" placeholder="イベントの詳細" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="開始日時">
                  <input type="datetime-local" value={draft.startsAt} onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })} />
                </Field>
                <Field label="終了日時">
                  <input type="datetime-local" value={draft.endsAt} onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })} />
                </Field>
                <Field label="定員">
                  <input type="number" value={draft.capacity} onChange={(e) => setDraft({ ...draft, capacity: parseInt(e.target.value) || 0 })} />
                </Field>
                <Field label="受付締切">
                  <input type="datetime-local" value={draft.deadline} onChange={(e) => setDraft({ ...draft, deadline: e.target.value })} />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-[13px] text-text-primary cursor-pointer">
                <input type="checkbox" checked={draft.isPublic} onChange={(e) => setDraft({ ...draft, isPublic: e.target.checked })} />
                <span>会員画面に公開する</span>
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={save} disabled={!draft.title.trim()} className="flex-1 py-2.5 bg-accent text-white text-[13px] font-medium rounded-[var(--radius)] hover:bg-accent-hover disabled:opacity-50">
                {editing ? "更新" : "作成"}
              </button>
              <button onClick={() => { setCreating(false); setEditing(null); }} className="px-4 py-2.5 border border-border text-[13px] rounded-[var(--radius)] hover:bg-bg-hover">
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-text-secondary mb-1">
        {label}{required && <span className="text-status-danger ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
