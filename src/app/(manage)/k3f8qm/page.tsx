"use client";

import { useState, useMemo } from "react";
import { Calendar, Check, X, Plus } from "lucide-react";

const CUSTOMER_SUGGESTIONS = [
  { nickname: "タロウ", realName: "田中 太郎" },
  { nickname: "ハナ", realName: "鈴木 花子" },
  { nickname: "ケン", realName: "佐藤 健一" },
  { nickname: "ユウ", realName: "渡辺 優子" },
  { nickname: "ショウ", realName: "山本 翔太" },
];

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

const INIT: Reservation[] = [
  { id: "rv1", customerName: "田中 太郎", nickname: "タロウ", date: "2026-04-21", slot: "19:00-22:00", partySize: 2, status: "confirmed", source: "member_line" },
  { id: "rv2", customerName: "鈴木 花子", nickname: "ハナ", date: "2026-04-21", slot: "20:00-24:00", partySize: 1, status: "pending", source: "member_line", note: "誕生日イベント参加" },
  { id: "rv3", customerName: "渡辺 優子", nickname: "ユウ", date: "2026-04-21", slot: "21:00-24:00", partySize: 3, status: "confirmed", source: "staff_manual" },
  { id: "rv4", customerName: "中村 あゆみ", nickname: "アユ", date: "2026-04-22", slot: "18:00-21:00", partySize: 2, status: "pending", source: "phone" },
  { id: "rv5", customerName: "山本 翔太", nickname: "ショウ", date: "2026-04-23", slot: "19:00-23:00", partySize: 4, status: "confirmed", source: "member_line", note: "トナメ参加" },
];

const STATUS_LABEL: Record<ResvStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: "未確定",  color: "#c87b1a", bg: "#fdf4e8" },
  confirmed: { label: "確定",    color: "#2e7d5b", bg: "#e8f5f0" },
  canceled:  { label: "取消",    color: "#8e9baa", bg: "#f3f0ec" },
  no_show:   { label: "No Show", color: "#c0392b", bg: "#fce8e6" },
  arrived:   { label: "来店済",  color: "#2c3e50", bg: "#e8e4df" },
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
    <div className="space-y-4 max-w-4xl">
      {/* 日付セレクタ */}
      <div className="flex items-center gap-1 flex-wrap">
        {days.map((d) => {
          const count = (byDate[d] ?? []).length;
          const active = selectedDate === d;
          return (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`px-3 py-1.5 text-[12px] rounded-[6px] border transition-colors ${
                active
                  ? "bg-accent text-white border-accent"
                  : "border-border text-text-secondary hover:bg-bg-hover"
              }`}
            >
              <Calendar className="w-3 h-3 inline mr-1" />
              {d.slice(5)}
              {count > 0 && <span className="ml-1 text-[10px] opacity-75">({count})</span>}
            </button>
          );
        })}
        <button onClick={() => { setDraft((d) => ({ ...d, date: selectedDate })); setShowForm(true); }} className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-accent text-white text-[12px] font-medium rounded-[var(--radius)] hover:bg-accent-hover">
          <Plus className="w-3 h-3" />店頭予約を追加
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-bg-white rounded-[var(--radius-lg)] w-full max-w-md p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
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
      <div>
        <h3 className="text-[13px] font-semibold text-text-primary mb-2">{selectedDate} の予約 ({today.length}件)</h3>
        {today.length === 0 ? (
          <p className="text-[13px] text-text-tertiary py-8 text-center">この日の予約はありません</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border-light">
                <th className="px-3 py-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-left">時間帯</th>
                <th className="px-3 py-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-left">顧客</th>
                <th className="px-3 py-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-left">人数</th>
                <th className="px-3 py-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-left">経路</th>
                <th className="px-3 py-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-left">備考</th>
                <th className="px-3 py-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-left">状態</th>
                <th className="px-3 py-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {today.map((r) => {
                const meta = STATUS_LABEL[r.status];
                return (
                  <tr key={r.id} className="border-b border-border-light hover:bg-bg-hover">
                    <td className="px-3 py-2 font-medium">{r.slot}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium">{r.nickname || r.customerName}</span>
                        {r.nickname && <span className="text-[11px] text-text-tertiary">{r.customerName}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-text-secondary">{r.partySize}名</td>
                    <td className="px-3 py-2 text-text-secondary">{SOURCE_LABEL[r.source]}</td>
                    <td className="px-3 py-2 text-text-secondary text-[12px] truncate max-w-[200px]">{r.note || "-"}</td>
                    <td className="px-3 py-2">
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-[3px]" style={{ color: meta.color, backgroundColor: meta.bg }}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        {r.status === "pending" && (
                          <button onClick={() => updateStatus(r.id, "confirmed")} className="text-[11px] text-status-success hover:bg-accent-light px-2 py-1 rounded-[4px]">
                            <Check className="w-3 h-3 inline mr-0.5" />確定
                          </button>
                        )}
                        {r.status !== "canceled" && r.status !== "arrived" && (
                          <button onClick={() => updateStatus(r.id, "arrived")} className="text-[11px] text-text-secondary hover:bg-bg-hover px-2 py-1 rounded-[4px]">
                            来店
                          </button>
                        )}
                        {r.status !== "canceled" && (
                          <button onClick={() => updateStatus(r.id, "canceled")} className="text-[11px] text-status-danger hover:bg-status-danger-bg px-2 py-1 rounded-[4px]">
                            <X className="w-3 h-3 inline" />
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
      </div>
    </div>
  );
}
