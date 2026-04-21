"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Sparkles, Calendar, X } from "lucide-react";

interface Rule {
  id: string;
  name: string;
  points: number;
  conditionText: string;
  isActive: boolean;
  priority: number;
  startsAt?: string;
  endsAt?: string;
  description?: string;
}

const INIT: Rule[] = [
  { id: "r1", name: "通常来店", points: 10, conditionText: "来店時", isActive: true, priority: 100, description: "毎回の来店で付与" },
  { id: "r2", name: "平日来店ボーナス", points: 5, conditionText: "来店 AND 平日", isActive: true, priority: 90, description: "月〜金の来店に追加" },
  { id: "r3", name: "初回紹介ボーナス", points: 100, conditionText: "紹介先が初来店", isActive: true, priority: 80, description: "紹介された会員の初来店時、紹介者に付与" },
  { id: "r4", name: "月間10回来店達成", points: 50, conditionText: "月間来店回数 >= 10", isActive: true, priority: 70, description: "その月の10回目来店時" },
  { id: "r5", name: "イベント参加", points: 30, conditionText: "event.status = attended", isActive: true, priority: 60, description: "イベント参加時" },
  { id: "r6", name: "春季限定キャンペーン", points: 20, conditionText: "来店 AND 期間内", isActive: false, priority: 50, startsAt: "2026-03-01", endsAt: "2026-05-31", description: "春キャンペーン期間のみ" },
];

type Draft = Omit<Rule, "id">;
const EMPTY: Draft = { name: "", points: 10, conditionText: "来店時", isActive: true, priority: 100, description: "" };

export default function PointRulesPage() {
  const [rules, setRules] = useState<Rule[]>(INIT);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);

  function startCreate() { setDraft(EMPTY); setCreating(true); }
  function startEdit(r: Rule) {
    setDraft({ name: r.name, points: r.points, conditionText: r.conditionText, isActive: r.isActive, priority: r.priority, startsAt: r.startsAt, endsAt: r.endsAt, description: r.description });
    setEditing(r);
  }

  function save() {
    if (!draft.name.trim()) return;
    if (editing) {
      setRules((p) => p.map((r) => (r.id === editing.id ? { ...r, ...draft } : r)));
      setEditing(null);
    } else {
      setRules((p) => [...p, { id: `r${Date.now()}`, ...draft }].sort((a, b) => b.priority - a.priority));
      setCreating(false);
    }
  }
  function toggle(id: string) {
    setRules((p) => p.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)));
  }
  function remove(id: string) {
    if (!window.confirm("削除しますか？")) return;
    setRules((p) => p.filter((r) => r.id !== id));
  }

  const showModal = creating || editing !== null;

  const activeCount = rules.filter(r => r.isActive).length;

  return (
    <div className="page-stack">
      {/* KPI */}
      <section>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="flex items-end gap-8 flex-wrap">
            <KpiItem label="ルール" value={rules.length} unit="件" />
            <KpiItem label="アクティブ" value={activeCount} unit="件" accent />
            <KpiItem label="停止中" value={rules.length - activeCount} unit="件" />
          </div>
          <button onClick={startCreate} className="btn btn-primary">
            <Plus className="w-3.5 h-3.5" />ルール追加
          </button>
        </div>
      </section>

      {/* 情報バナー */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-[var(--radius)]"
        style={{ background: "var(--warning-soft-bg)", border: "1px solid rgba(200,123,26,0.22)", backdropFilter: "blur(8px)" }}>
        <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-[color:var(--warning-text)]" />
        <p className="text-[13px] text-[color:var(--warning-text)] leading-relaxed">
          ポイントルールは <strong>条件 + 加算値</strong> の形で登録できます。変更は即時反映されますが、既存の付与履歴は遡及しません。
        </p>
      </div>

      {/* テーブル */}
      <section className="glass-panel">
        <p className="t-label mb-3">ルール一覧</p>
      <table className="data-table">
        <thead>
          <tr>
            <th className="w-12">優先度</th>
            <th>ルール</th>
            <th>条件</th>
            <th>加算</th>
            <th>期間</th>
            <th className="px-3 py-2 data-th">状態</th>
            <th className="px-3 py-2 data-th"></th>
          </tr>
        </thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.id} className="border-b border-border-light hover:bg-bg-hover">
              <td className="px-3 py-2.5 font-mono text-[11px] text-text-tertiary">{r.priority}</td>
              <td className="px-3 py-2.5">
                <div className="font-medium text-text-primary">{r.name}</div>
                {r.description && <div className="text-[11px] text-text-tertiary">{r.description}</div>}
              </td>
              <td className="px-3 py-2.5 font-mono text-[11px] text-text-secondary">{r.conditionText}</td>
              <td className="px-3 py-2.5 font-bold text-accent">+{r.points}</td>
              <td className="px-3 py-2.5 text-[11px] text-text-secondary">
                {r.startsAt ? (<><Calendar className="w-3 h-3 inline mr-0.5" />{r.startsAt.slice(5)}〜{r.endsAt?.slice(5) ?? "無期限"}</>) : "無期限"}
              </td>
              <td className="px-3 py-2.5">
                <button onClick={() => toggle(r.id)} className={`${r.isActive ? "chip chip-success" : "bg-bg-hover text-text-tertiary"}`}>
                  {r.isActive ? "有効" : "停止中"}
                </button>
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(r)} className="p-1 hover:bg-bg-hover rounded text-text-secondary"><Pencil className="w-3 h-3" /></button>
                  <button onClick={() => remove(r.id)} className="p-1 hover:bg-status-danger-bg rounded text-status-danger"><Trash2 className="w-3 h-3" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </section>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setCreating(false); setEditing(null); }}>
          <div className="modal-card modal-card-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold">{editing ? "ルール編集" : "ルール追加"}</h3>
              <button onClick={() => { setCreating(false); setEditing(null); }} className="p-1 hover:bg-bg-hover rounded"><X className="w-4 h-4 text-text-tertiary" /></button>
            </div>

            <div className="space-y-3">
              <Field label="ルール名" required>
                <input type="text" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="例: 通常来店" />
              </Field>
              <Field label="条件式" required>
                <input type="text" value={draft.conditionText} onChange={(e) => setDraft({ ...draft, conditionText: e.target.value })} placeholder="来店時 / 来店 AND 平日" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="加算ポイント">
                  <input type="number" value={draft.points} onChange={(e) => setDraft({ ...draft, points: parseInt(e.target.value) || 0 })} />
                </Field>
                <Field label="優先度 (数値大=先に評価)">
                  <input type="number" value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: parseInt(e.target.value) || 0 })} />
                </Field>
                <Field label="開始日">
                  <input type="date" value={draft.startsAt || ""} onChange={(e) => setDraft({ ...draft, startsAt: e.target.value || undefined })} />
                </Field>
                <Field label="終了日">
                  <input type="date" value={draft.endsAt || ""} onChange={(e) => setDraft({ ...draft, endsAt: e.target.value || undefined })} />
                </Field>
              </div>
              <Field label="説明">
                <textarea rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="resize-none" placeholder="運用メモ" />
              </Field>
              <label className="flex items-center gap-2 text-[13px] text-text-primary cursor-pointer">
                <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} />
                <span>有効にする</span>
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={save} disabled={!draft.name.trim()} className="flex-1 py-2.5 bg-accent text-white text-[13px] font-medium rounded-[var(--radius)] hover:bg-accent-hover disabled:opacity-50">
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

function KpiItem({ label, value, unit, accent }: { label: string; value: string | number; unit?: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="t-label">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className="t-value" style={{ color: accent ? "var(--primary-text)" : "var(--text-primary)" }}>{value}</span>
        {unit && <span className="text-[14px] text-text-tertiary">{unit}</span>}
      </span>
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
