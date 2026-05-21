"use client";

import { useState, useMemo } from "react";
import { Calendar, Check, X, Plus } from "lucide-react";

const CUSTOMER_SUGGESTIONS: { nickname: string; realName: string }[] = [];

type ResvStatus = "pending" | "confirmed" | "canceled" | "no_show" | "arrived";

interface Reservation {
  id: string;
  customerName: string;
  nickname?: string;
  date: string;           // YYYY-MM-DD
  slot: string;           // '18:00-20:00'
  partySize: number;
  note?: string;
  status: ResvStatus;
  source: "member_line" | "staff_manual" | "phone";
}

const INIT: Reservation[] = [];

const STATUS_CHIP: Record<ResvStatus, { label: string; chip: string }> = {
  pending:   { label: "未確定",  chip: "chip-warning" },
  confirmed: { label: "確定",    chip: "chip-success" },
  canceled:  { label: "取消",    chip: "chip-neutral" },
  no_show:   { label: "No Show", chip: "chip-danger"  },
  arrived:   { label: "来店済",  chip: "chip-accent"  },
};

const SOURCE_LABEL: Record<Reservation["source"], string> = {
  member_line: "LINE",
  staff_manual: "店頭",
  phone: "電話",
};

export default function ReservationPage() {
  const [reservations, setReservations] = useState<Reservation[]>(INIT);
  const [selectedDate, setSelectedDate] = useState("2026-04-21");
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ customerName: "", nickname: "", date: "2026-04-21", slot: "19:00-22:00", partySize: 1, note: "" });

  function addReservation() {
    if (!draft.customerName.trim()) return;
    setReservations((p) => [
      ...p,
      { id: `rv${Date.now()}`, customerName: draft.customerName, nickname: draft.nickname || undefined, date: draft.date, slot: draft.slot, partySize: draft.partySize, note: draft.note || undefined, status: "confirmed", source: "staff_manual" },
    ]);
    setDraft({ customerName: "", nickname: "", date: selectedDate, slot: "19:00-22:00", partySize: 1, note: "" });
    setShowForm(false);
  }

  const byDate = useMemo(() => {
    const map: Record<string, Reservation[]> = {};
    reservations.forEach((r) => { (map[r.date] ??= []).push(r); });
    return map;
  }, [reservations]);

  const today = byDate[selectedDate] ?? [];

  function updateStatus(id: string, status: ResvStatus) {
    setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  // 7日間のヘッダー
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date("2026-04-21T00:00:00");
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  return (
    <div className="page-stack">
      {/* 日付セレクタ + アクション */}
      <section>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="tabs">
            {days.map((d) => {
              const count = (byDate[d] ?? []).length;
              const active = selectedDate === d;
              return (
                <button key={d} onClick={() => setSelectedDate(d)} className={`tab ${active ? "tab-active" : ""}`}>
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {d.slice(5)}
                  {count > 0 && <span className="ml-1 text-[10px] opacity-75">({count})</span>}
                </button>
              );
            })}
          </div>
          <button onClick={() => { setDraft((d) => ({ ...d, date: selectedDate })); setShowForm(true); }} className="btn btn-primary ml-auto">
            <Plus className="w-3.5 h-3.5" />店頭予約を追加
          </button>
        </div>
      </section>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-card modal-card-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold">店頭予約を追加</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-bg-hover rounded"><X className="w-4 h-4 text-text-tertiary" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-text-secondary mb-1">顧客 <span className="text-status-danger">*</span></label>
                <div className="flex gap-2">
                  <input type="text" value={draft.nickname} onChange={(e) => setDraft({ ...draft, nickname: e.target.value })} placeholder="ニックネーム" className="flex-1" />
                  <input type="text" value={draft.customerName} onChange={(e) => setDraft({ ...draft, customerName: e.target.value })} placeholder="本名" className="flex-1" />
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {CUSTOMER_SUGGESTIONS.map((c) => (
                    <button key={c.realName} onClick={() => setDraft({ ...draft, nickname: c.nickname, customerName: c.realName })} className="text-[10px] px-2 py-0.5 border border-border-light rounded text-text-secondary hover:bg-bg-hover">
                      {c.nickname}（{c.realName}）
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-text-secondary mb-1">来店日</label>
                  <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-text-secondary mb-1">時間帯</label>
                  <select value={draft.slot} onChange={(e) => setDraft({ ...draft, slot: e.target.value })}>
                    {["18:00-20:00","19:00-22:00","20:00-24:00","21:00-24:00","22:00-02:00"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-text-secondary mb-1">人数</label>
                  <input type="number" min={1} max={10} value={draft.partySize} onChange={(e) => setDraft({ ...draft, partySize: parseInt(e.target.value) || 1 })} />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-text-secondary mb-1">備考</label>
                <textarea rows={2} value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} className="resize-none" placeholder="トナメ参加 / 記念日 等" />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={addReservation} disabled={!draft.customerName.trim()} className="flex-1 py-2.5 bg-accent text-white text-[13px] font-medium rounded-[var(--radius)] hover:bg-accent-hover disabled:opacity-50">
                予約を追加
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-border text-[13px] rounded-[var(--radius)] hover:bg-bg-hover">
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 一覧 */}
      <section className="glass-panel">
        <div className="flex items-baseline gap-3 mb-3">
          <p className="t-label">{selectedDate} の予約</p>
          <span className="t-xs text-text-tertiary">{today.length}件</span>
        </div>
        {today.length === 0 ? (
          <p className="text-[14px] text-text-tertiary py-10 text-center">この日の予約はありません</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>時間帯</th>
                <th>顧客</th>
                <th>人数</th>
                <th>経路</th>
                <th>備考</th>
                <th>状態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {today.map((r) => {
                const meta = STATUS_CHIP[r.status];
                return (
                  <tr key={r.id}>
                    <td className="font-medium">{r.slot}</td>
                    <td>
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium">{r.nickname || r.customerName}</span>
                        {r.nickname && <span className="text-[12px] text-text-tertiary">{r.customerName}</span>}
                      </div>
                    </td>
                    <td className="text-text-secondary">{r.partySize}名</td>
                    <td>
                      <span className="chip chip-neutral chip-sm">{SOURCE_LABEL[r.source]}</span>
                    </td>
                    <td className="text-text-secondary truncate max-w-[200px]">{r.note || "-"}</td>
                    <td>
                      <span className={`chip ${meta.chip} chip-sm`}>{meta.label}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        {r.status === "pending" && (
                          <button onClick={() => updateStatus(r.id, "confirmed")} className="btn btn-subtle btn-xs">
                            <Check className="w-3 h-3" />確定
                          </button>
                        )}
                        {r.status !== "canceled" && r.status !== "arrived" && (
                          <button onClick={() => updateStatus(r.id, "arrived")} className="btn btn-ghost btn-xs">来店</button>
                        )}
                        {r.status !== "canceled" && (
                          <button onClick={() => updateStatus(r.id, "canceled")} className="btn btn-danger btn-xs">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
