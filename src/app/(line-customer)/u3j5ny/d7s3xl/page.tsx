"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar as CalendarIcon, Users, MapPin, CheckCircle, Clock, ChevronLeft, ChevronRight } from "lucide-react";

interface EventItem {
  id: string;
  title: string;
  category: "tournament" | "party" | "campaign";
  date: string; // YYYY-MM-DD
  time: string;
  capacity: number;
  reserved: number;
  fee?: number;
  note?: string;
  myReserved: boolean;
}

const CATEGORY_LABEL = { tournament: "トナメ", party: "パーティ", campaign: "キャンペーン" } as const;
const CATEGORY_CHIP = { tournament: "chip-accent", party: "chip-vip", campaign: "chip-warning" } as const;

const EVENTS: EventItem[] = [
  { id: "e1", title: "春のVIPナイト", category: "party", date: "2026-04-25", time: "20:00-02:00", capacity: 30, reserved: 18, fee: 3000, note: "ウェルカムドリンク付き", myReserved: true },
  { id: "e2", title: "ウィークエンドトーナメント", category: "tournament", date: "2026-04-27", time: "19:00-23:00", capacity: 40, reserved: 25, fee: 5000, myReserved: false },
  { id: "e3", title: "新作カクテル試飲会", category: "campaign", date: "2026-05-02", time: "22:00-23:00", capacity: 10, reserved: 3, myReserved: false },
  { id: "e4", title: "GWビッグトーナメント", category: "tournament", date: "2026-05-05", time: "18:00-24:00", capacity: 60, reserved: 42, fee: 10000, note: "優勝賞金あり", myReserved: false },
  { id: "e5", title: "女子会ナイト", category: "party", date: "2026-05-10", time: "20:00-01:00", capacity: 20, reserved: 8, fee: 2500, myReserved: false },
  { id: "e6", title: "マルチケ2倍キャンペーン", category: "campaign", date: "2026-05-15", time: "18:00-06:00", capacity: 999, reserved: 0, note: "全来店対象", myReserved: false },
];

function dateLabel(iso: string): string {
  const d = new Date(iso);
  const dow = ["日","月","火","水","木","金","土"][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()}(${dow})`;
}

export default function MemberSchedulePage() {
  const [filter, setFilter] = useState<"all" | "mine" | EventItem["category"]>("all");
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(2026, 3); // 2026/04
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [events, setEvents] = useState(EVENTS);

  function toggleReserve(id: string) {
    setEvents(prev => prev.map(e =>
      e.id === id ? {
        ...e,
        myReserved: !e.myReserved,
        reserved: e.myReserved ? e.reserved - 1 : e.reserved + 1,
      } : e
    ));
  }

  const filtered = events.filter(e => {
    if (filter === "all") return true;
    if (filter === "mine") return e.myReserved;
    return e.category === filter;
  });

  // カレンダー用にイベントを日付Mapに
  const eventsByDate = events.reduce<Record<string, EventItem[]>>((acc, e) => {
    (acc[e.date] ??= []).push(e);
    return acc;
  }, {});

  const myUpcoming = events.filter(e => e.myReserved).sort((a, b) => a.date.localeCompare(b.date));

  // カレンダー描画用
  const firstDay = new Date(viewMonth.y, viewMonth.m, 1);
  const daysInMonth = new Date(viewMonth.y, viewMonth.m + 1, 0).getDate();
  const startPadding = firstDay.getDay();
  const cells = Array.from({ length: startPadding + daysInMonth }, (_, i) => {
    if (i < startPadding) return null;
    const day = i - startPadding + 1;
    const iso = `${viewMonth.y}-${String(viewMonth.m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return { day, iso };
  });

  function changeMonth(dir: -1 | 1) {
    setViewMonth(prev => {
      const d = new Date(prev.y, prev.m + dir, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  return (
    <div className="space-y-4">
      <Link href="/u3j5ny" className="flex items-center gap-1 text-[12px] text-text-tertiary hover:text-text-secondary">
        <ArrowLeft className="w-3.5 h-3.5" />マイページへ
      </Link>

      <h2 className="text-[16px] font-bold flex items-center gap-1.5">
        <CalendarIcon className="w-4 h-4" />スケジュール
      </h2>

      {/* 予約中のイベント */}
      {myUpcoming.length > 0 && (
        <section>
          <p className="text-[11px] text-text-tertiary mb-1.5">予約中のイベント</p>
          <div className="space-y-1.5">
            {myUpcoming.map(e => (
              <div key={e.id} className="bg-accent-light border border-accent/30 rounded-[var(--radius)] px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <CheckCircle className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                  <span className="text-[13px] font-semibold truncate">{e.title}</span>
                </div>
                <p className="text-[11px] text-text-secondary">{dateLabel(e.date)} {e.time}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* カレンダー */}
      <section className="bg-bg-white border border-border rounded-[var(--radius-lg)] p-3">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-bg-hover rounded"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-[13px] font-semibold">{viewMonth.y}年{viewMonth.m + 1}月</span>
          <button onClick={() => changeMonth(1)} className="p-1 hover:bg-bg-hover rounded"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {["日","月","火","水","木","金","土"].map((d, i) => (
            <div key={d} className={`text-[10px] py-1 ${i === 0 ? "text-status-danger" : i === 6 ? "text-accent" : "text-text-tertiary"}`}>
              {d}
            </div>
          ))}
          {cells.map((cell, i) => {
            if (!cell) return <div key={i} />;
            const dayEvents = eventsByDate[cell.iso] || [];
            const hasMine = dayEvents.some(e => e.myReserved);
            return (
              <div
                key={i}
                className={`relative aspect-square flex flex-col items-center justify-start py-1 text-[11px] rounded-[4px] ${
                  dayEvents.length > 0 ? "bg-bg-hover" : ""
                }`}
              >
                <span className={`font-medium ${hasMine ? "text-accent font-bold" : ""}`}>{cell.day}</span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map(e => (
                      <span
                        key={e.id}
                        className={`w-1 h-1 rounded-full ${
                          e.myReserved ? "bg-accent"
                          : e.category === "tournament" ? "bg-[#3a8f7c]"
                          : e.category === "party" ? "bg-[#7c3aed]"
                          : "bg-[#d97706]"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* フィルタ */}
      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1">
        {[
          { key: "all" as const, label: "すべて" },
          { key: "mine" as const, label: "予約中" },
          { key: "tournament" as const, label: "トナメ" },
          { key: "party" as const, label: "パーティ" },
          { key: "campaign" as const, label: "キャンペーン" },
        ].map(f => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1 text-[11px] font-medium rounded-full whitespace-nowrap border transition-colors ${
                active ? "bg-text-primary text-white border-text-primary" : "bg-bg-white text-text-secondary border-border"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* イベント一覧 */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <p className="text-center text-[12px] text-text-tertiary py-6">該当するイベントはありません</p>
        ) : filtered.map(e => {
          const pct = Math.min(100, Math.round((e.reserved / e.capacity) * 100));
          const full = e.reserved >= e.capacity;
          return (
            <div key={e.id} className="bg-bg-white border border-border rounded-[var(--radius-lg)] p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`chip chip-sm ${CATEGORY_CHIP[e.category]}`}>{CATEGORY_LABEL[e.category]}</span>
                    {e.myReserved && <span className="chip chip-sm chip-success">予約済</span>}
                  </div>
                  <h3 className="text-[14px] font-bold">{e.title}</h3>
                </div>
                {e.fee != null && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-[13px] font-bold">¥{e.fee.toLocaleString()}</p>
                    <p className="text-[9px] text-text-tertiary">参加費</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-secondary">
                <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" />{dateLabel(e.date)}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{e.time}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{e.reserved}/{e.capacity === 999 ? "制限なし" : e.capacity}</span>
              </div>

              {e.note && (
                <p className="text-[11px] text-text-tertiary bg-bg-hover rounded-[4px] px-2 py-1">
                  {e.note}
                </p>
              )}

              {e.capacity !== 999 && (
                <div className="h-1 bg-bg rounded-full overflow-hidden">
                  <div className={`h-full ${full ? "bg-status-danger" : "bg-accent"}`} style={{ width: `${pct}%` }} />
                </div>
              )}

              <button
                onClick={() => toggleReserve(e.id)}
                disabled={!e.myReserved && full}
                className={`w-full py-2 text-[12px] font-medium rounded-[var(--radius)] transition-colors ${
                  e.myReserved
                    ? "bg-bg-hover text-status-danger border border-status-danger/30 hover:bg-status-danger-bg"
                    : full
                    ? "bg-bg-hover text-text-tertiary border border-border"
                    : "bg-accent text-white hover:bg-accent-hover"
                }`}
              >
                {e.myReserved ? "予約をキャンセル" : full ? "満席" : "予約する"}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-text-tertiary flex items-center gap-1">
        <MapPin className="w-3 h-3" />Come On Casino 開催
      </p>
    </div>
  );
}
