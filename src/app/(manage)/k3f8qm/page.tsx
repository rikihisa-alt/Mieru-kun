"use client";

import { useState, useMemo } from "react";
import { Calendar, Check, X, Plus } from "lucide-react";

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
                  ? "bg-[#3a8f7c] text-white border-[#3a8f7c]"
                  : "border-[#d8d3cc] text-[#5a6977] hover:bg-[#f3f0ec]"
              }`}
            >
              <Calendar className="w-3 h-3 inline mr-1" />
              {d.slice(5)}
              {count > 0 && <span className="ml-1 text-[10px] opacity-75">({count})</span>}
            </button>
          );
        })}
        <button className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-[#3a8f7c] text-white text-[12px] font-medium rounded-[6px] hover:bg-[#2f7a69]">
          <Plus className="w-3 h-3" />店頭予約を追加
        </button>
      </div>

      {/* 一覧 */}
      <div>
        <h3 className="text-[13px] font-semibold text-[#2c3e50] mb-2">{selectedDate} の予約 ({today.length}件)</h3>
        {today.length === 0 ? (
          <p className="text-[13px] text-[#8e9baa] py-8 text-center">この日の予約はありません</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#e8e4df]">
                <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">時間帯</th>
                <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">顧客</th>
                <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">人数</th>
                <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">経路</th>
                <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">備考</th>
                <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">状態</th>
                <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {today.map((r) => {
                const meta = STATUS_LABEL[r.status];
                return (
                  <tr key={r.id} className="border-b border-[#f3f0ec] hover:bg-[#faf8f5]">
                    <td className="px-3 py-2 font-medium">{r.slot}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium">{r.nickname || r.customerName}</span>
                        {r.nickname && <span className="text-[11px] text-[#8e9baa]">{r.customerName}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[#5a6977]">{r.partySize}名</td>
                    <td className="px-3 py-2 text-[#5a6977]">{SOURCE_LABEL[r.source]}</td>
                    <td className="px-3 py-2 text-[#5a6977] text-[12px] truncate max-w-[200px]">{r.note || "-"}</td>
                    <td className="px-3 py-2">
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-[3px]" style={{ color: meta.color, backgroundColor: meta.bg }}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        {r.status === "pending" && (
                          <button onClick={() => updateStatus(r.id, "confirmed")} className="text-[11px] text-[#2e7d5b] hover:bg-[#e8f5f0] px-2 py-1 rounded-[4px]">
                            <Check className="w-3 h-3 inline mr-0.5" />確定
                          </button>
                        )}
                        {r.status !== "canceled" && r.status !== "arrived" && (
                          <button onClick={() => updateStatus(r.id, "arrived")} className="text-[11px] text-[#5a6977] hover:bg-[#f3f0ec] px-2 py-1 rounded-[4px]">
                            来店
                          </button>
                        )}
                        {r.status !== "canceled" && (
                          <button onClick={() => updateStatus(r.id, "canceled")} className="text-[11px] text-[#c5221f] hover:bg-[#fce8e6] px-2 py-1 rounded-[4px]">
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
