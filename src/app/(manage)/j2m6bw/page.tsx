"use client";

import { useState } from "react";
import { Plus, Upload, Eye, EyeOff, Trash2, Image as ImageIcon, Pencil, X } from "lucide-react";
import { usePersistedState } from "@/lib/persist/store";

interface Pop {
  id: string;
  title: string;
  imageUrl: string;
  isPublic: boolean;
  linkedEvent?: string;
}

const INIT: Pop[] = [
  { id: "p1", title: "春の感謝祭", imageUrl: "/illustrations/before-chip.png", isPublic: true, linkedEvent: "春のVIPナイト" },
  { id: "p2", title: "ウィークエンドトーナメント", imageUrl: "/illustrations/after-chip.png", isPublic: true, linkedEvent: "ホールデム・ウィークエンドトーナメント" },
  { id: "p3", title: "新作メニュー", imageUrl: "/illustrations/before-table.png", isPublic: false },
];

const EVENT_OPTIONS = [
  "なし",
  "春のVIPナイト",
  "ホールデム・ウィークエンドトーナメント",
  "新作カクテル試飲会",
];

export default function PopManagePage() {
  const [pops, setPops] = usePersistedState<Pop[]>("page_pops_v1", INIT);
  const [editing, setEditing] = useState<Pop | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<{ title: string; imageUrl: string; linkedEvent: string }>({ title: "", imageUrl: "", linkedEvent: "なし" });

  function startCreate() {
    setDraft({ title: "", imageUrl: "", linkedEvent: "なし" });
    setCreating(true);
  }
  function startEdit(p: Pop) {
    setDraft({ title: p.title, imageUrl: p.imageUrl, linkedEvent: p.linkedEvent || "なし" });
    setEditing(p);
  }
  function save() {
    if (!draft.title.trim()) return;
    const linked = draft.linkedEvent === "なし" ? undefined : draft.linkedEvent;
    if (editing) {
      setPops((p) => p.map((x) => (x.id === editing.id ? { ...x, title: draft.title, imageUrl: draft.imageUrl || x.imageUrl, linkedEvent: linked } : x)));
      setEditing(null);
    } else {
      setPops((p) => [...p, { id: `p${Date.now()}`, title: draft.title, imageUrl: draft.imageUrl || "/illustrations/before-chip.png", isPublic: true, linkedEvent: linked }]);
      setCreating(false);
    }
  }
  function togglePublic(id: string) {
    setPops((p) => p.map((x) => (x.id === id ? { ...x, isPublic: !x.isPublic } : x)));
  }
  function remove(id: string) {
    if (!window.confirm("削除しますか？")) return;
    setPops((p) => p.filter((x) => x.id !== id));
  }

  function onFileChange(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setDraft((d) => ({ ...d, imageUrl: reader.result as string }));
    reader.readAsDataURL(file);
  }

  const showModal = creating || editing !== null;

  const publicCount = pops.filter(p => p.isPublic).length;

  return (
    <div className="page-stack">
      {/* KPI */}
      <section>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="flex items-end gap-8 flex-wrap">
            <KpiItem label="POP" value={pops.length} unit="件" />
            <KpiItem label="公開中" value={publicCount} unit="件" />
          </div>
          <button onClick={startCreate} className="btn btn-primary">
            <Plus className="w-3.5 h-3.5" />POP作成
          </button>
        </div>
      </section>

      <section>
        <p className="t-label mb-3">POP一覧</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {pops.map((p) => (
          <div key={p.id} className="glass-panel overflow-hidden !p-0">
            <div className="aspect-square flex items-center justify-center" style={{ background: "rgba(28,46,60,0.03)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.imageUrl ? <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" /> : <ImageIcon className="w-12 h-12 text-[rgba(28,46,60,0.15)]" />}
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="text-[15px] font-semibold text-text-primary truncate">{p.title}</h4>
                  {p.linkedEvent && <p className="t-xs text-text-tertiary truncate mt-0.5">→ {p.linkedEvent}</p>}
                </div>
                <button onClick={() => togglePublic(p.id)} className="btn btn-ghost btn-xs shrink-0">
                  {p.isPublic ? <Eye className="w-3.5 h-3.5 text-[color:var(--primary-text)]" /> : <EyeOff className="w-3.5 h-3.5 text-text-tertiary" />}
                </button>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className={`${p.isPublic ? "chip chip-success" : "bg-bg-hover text-text-tertiary"}`}>
                  {p.isPublic ? "公開中" : "非公開"}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(p)} className="p-1 hover:bg-bg-hover rounded text-text-secondary"><Pencil className="w-3 h-3" /></button>
                  <button onClick={() => remove(p.id)} className="p-1 hover:bg-status-danger-bg rounded text-status-danger"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      </section>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setCreating(false); setEditing(null); }}>
          <div className="modal-card modal-card-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold">{editing ? "POP編集" : "POP作成"}</h3>
              <button onClick={() => { setCreating(false); setEditing(null); }} className="p-1 hover:bg-bg-hover rounded"><X className="w-4 h-4 text-text-tertiary" /></button>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-text-secondary mb-1">タイトル <span className="text-status-danger">*</span></label>
              <input type="text" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="POPタイトル" />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-text-secondary mb-1">画像</label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 px-3 py-2 border border-border text-[12px] text-text-secondary rounded-[var(--radius)] cursor-pointer hover:bg-bg-hover">
                  <Upload className="w-3.5 h-3.5" />
                  ファイル選択
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e.target.files?.[0] ?? null)} />
                </label>
                {draft.imageUrl && (
                  <div className="w-16 h-16 rounded-[var(--radius)] overflow-hidden border border-border-light">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={draft.imageUrl} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-text-secondary mb-1">連携イベント</label>
              <select value={draft.linkedEvent} onChange={(e) => setDraft({ ...draft, linkedEvent: e.target.value })}>
                {EVENT_OPTIONS.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={save} disabled={!draft.title.trim()} className="flex-1 py-2.5 bg-accent text-white text-[13px] font-medium rounded-[var(--radius)] hover:bg-accent-light hover:text-[#157a58] disabled:opacity-50">
                {editing ? "更新" : "作成"}
              </button>
              <button onClick={() => { setCreating(false); setEditing(null); }} className="btn btn-secondary">
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiItem({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="t-label">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className="t-value">{value}</span>
        {unit && <span className="text-[14px] text-text-tertiary">{unit}</span>}
      </span>
    </div>
  );
}
