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

const EVENTS: EventItem[] = [
  { id: "e1", title: "春のVIPナイト", category: "party", date: "2026-04-25", time: "20:00-02:00", capacity: 30, reserved: 18, fee: 3000, note: "ウェルカムドリンク付き", myReserved: true },
  { id: "e2", title: "ウィークエンドトーナメント", category: "tournament", date: "2026-04-27", time: "19:00-23:00", capacity: 40, reserved: 25, fee: 5000, myReserved: false },
  { id: "e3", title: "新作カクテル試飲会", category: "campaign", date: "2026-05-02", time: "22:00-23:00", capacity: 10, reserved: 3, myReserved: false },
  { id: "e4", title: "GWビッグトーナメント", category: "tournament", date: "2026-05-05", time: "18:00-24:00", capacity: 60, reserved: 42, fee: 10000, note: "優勝賞金あり", myReserved: false },
  { id: "e5", title: "女子会ナイト", category: "party", date: "2026-05-10", time: "20:00-01:00", capacity: 20, reserved: 8, fee: 2500, myReserved: false },
  { id: "e6", title: "マルチケ2倍キャンペーン", category: "campaign", date: "2026-05-15", time: "18:00-06:00", capacity: 999, reserved: 0, note: "全来店対象", myReserved: false },
];

function categoryChipClass(c: EventItem["category"]): string {
  if (c === "tournament") return "ln-chip ln-chip--success";
  if (c === "party") return "ln-chip ln-chip--vip";
  return "ln-chip ln-chip--warn";
}

function categoryDotColor(c: EventItem["category"]): string {
  if (c === "tournament") return "var(--ln-accent)";
  if (c === "party") return "#7c3aed";
  return "var(--ln-warn)";
}

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

  const filterTabs = [
    { key: "all" as const, label: "すべて" },
    { key: "mine" as const, label: "予約中" },
    { key: "tournament" as const, label: "トナメ" },
    { key: "party" as const, label: "パーティ" },
    { key: "campaign" as const, label: "キャンペーン" },
  ];

  return (
    <div className="ln-page">
      <div className="ln-stack">
        <Link href="/u3j5ny" className="ln-back">
          <ArrowLeft size={14} />マイページへ
        </Link>

        <h2 className="ln-h1" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <CalendarIcon size={18} />スケジュール
        </h2>

        {/* 予約中のイベント */}
        {myUpcoming.length > 0 && (
          <section>
            <p className="ln-eyebrow" style={{ marginBottom: 6 }}>予約中のイベント</p>
            <div className="ln-stack-sm">
              {myUpcoming.map(e => (
                <div
                  key={e.id}
                  className="ln-card ln-card-compact"
                  style={{ background: "var(--ln-accent-soft)", borderColor: "transparent" }}
                >
                  <div className="ln-row" style={{ marginBottom: 2 }}>
                    <CheckCircle size={14} style={{ color: "var(--ln-accent-text)", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</span>
                  </div>
                  <p className="ln-sub" style={{ fontSize: 11, margin: 0 }}>{dateLabel(e.date)} {e.time}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* カレンダー */}
        <section className="ln-card">
          <div className="ln-spread" style={{ marginBottom: 8 }}>
            <button
              onClick={() => changeMonth(-1)}
              className="ln-btn ln-btn--ghost ln-btn--sm"
              style={{ padding: 4, height: 28, width: 28 }}
              aria-label="前の月"
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{viewMonth.y}年{viewMonth.m + 1}月</span>
            <button
              onClick={() => changeMonth(1)}
              className="ln-btn ln-btn--ghost ln-btn--sm"
              style={{ padding: 4, height: 28, width: 28 }}
              aria-label="次の月"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, textAlign: "center" }}>
            {["日","月","火","水","木","金","土"].map((d, i) => (
              <div
                key={d}
                style={{
                  fontSize: 10,
                  padding: "4px 0",
                  color: i === 0 ? "var(--ln-danger)" : i === 6 ? "var(--ln-accent-text)" : "var(--ln-text-mute)",
                  fontWeight: 600,
                }}
              >
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
                  style={{
                    position: "relative",
                    aspectRatio: "1 / 1",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    padding: "4px 0",
                    fontSize: 11,
                    borderRadius: 4,
                    background: dayEvents.length > 0 ? "var(--ln-bg-alt)" : "transparent",
                  }}
                >
                  <span style={{ fontWeight: hasMine ? 700 : 500, color: hasMine ? "var(--ln-accent-text)" : undefined }}>
                    {cell.day}
                  </span>
                  {dayEvents.length > 0 && (
                    <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
                      {dayEvents.slice(0, 3).map(e => (
                        <span
                          key={e.id}
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: "50%",
                            background: e.myReserved ? "var(--ln-accent)" : categoryDotColor(e.category),
                          }}
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
        <div style={{ display: "flex", gap: 6, overflowX: "auto", margin: "0 -4px", padding: "0 4px" }}>
          {filterTabs.map(f => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={active ? "ln-btn ln-btn--primary ln-btn--sm" : "ln-btn ln-btn--sm"}
                style={{ borderRadius: 999, whiteSpace: "nowrap" }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* イベント一覧 */}
        <div className="ln-stack-sm" style={{ gap: 10 }}>
          {filtered.length === 0 ? (
            <p className="ln-empty">該当するイベントはありません</p>
          ) : filtered.map(e => {
            const pct = Math.min(100, Math.round((e.reserved / e.capacity) * 100));
            const full = e.reserved >= e.capacity;
            return (
              <div key={e.id} className="ln-card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div className="ln-grow">
                    <div className="ln-row" style={{ marginBottom: 4, flexWrap: "wrap" }}>
                      <span className={categoryChipClass(e.category)}>{CATEGORY_LABEL[e.category]}</span>
                      {e.myReserved && <span className="ln-chip ln-chip--success">予約済</span>}
                    </div>
                    <h3 className="ln-h2">{e.title}</h3>
                  </div>
                  {e.fee != null && (
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p className="ln-num" style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>¥{e.fee.toLocaleString()}</p>
                      <p className="ln-mute" style={{ fontSize: 9, margin: 0 }}>参加費</p>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", columnGap: 12, rowGap: 4, fontSize: 11, color: "var(--ln-text-sub)" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <CalendarIcon size={12} />{dateLabel(e.date)}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Clock size={12} />{e.time}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Users size={12} />{e.reserved}/{e.capacity === 999 ? "制限なし" : e.capacity}
                  </span>
                </div>

                {e.note && (
                  <p style={{ fontSize: 11, color: "var(--ln-text-sub)", background: "var(--ln-bg-alt)", borderRadius: 4, padding: "4px 8px", margin: 0 }}>
                    {e.note}
                  </p>
                )}

                {e.capacity !== 999 && (
                  <div style={{ height: 4, background: "var(--ln-bg-alt)", borderRadius: 999, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: full ? "var(--ln-danger)" : "var(--ln-accent)",
                      }}
                    />
                  </div>
                )}

                <button
                  onClick={() => toggleReserve(e.id)}
                  disabled={!e.myReserved && full}
                  className={
                    e.myReserved
                      ? "ln-btn ln-btn--full"
                      : full
                        ? "ln-btn ln-btn--full"
                        : "ln-btn ln-btn--primary ln-btn--full"
                  }
                  style={{
                    height: 38,
                    fontSize: 12,
                    ...(e.myReserved
                      ? { color: "var(--ln-danger)", borderColor: "var(--ln-danger-soft)", background: "var(--ln-danger-soft)" }
                      : full
                        ? { opacity: 0.6 }
                        : {}),
                  }}
                >
                  {e.myReserved ? "予約をキャンセル" : full ? "満席" : "予約する"}
                </button>
              </div>
            );
          })}
        </div>

        <p className="ln-mute" style={{ fontSize: 10, margin: 0, display: "inline-flex", alignItems: "center", gap: 4 }}>
          <MapPin size={12} />Come On Casino 開催
        </p>
      </div>
    </div>
  );
}
