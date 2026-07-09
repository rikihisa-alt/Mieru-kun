"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePersisted, usePersistedState } from "@/lib/persist/store";
import { eventStore } from "@/lib/store/domain-stores";
import { PageHeader, Btn, Panel, Field, Modal, VStack, HStack, Kpis, Kpi, Dot } from "@/components/v2/ui";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

// ============= 型 =============
type DayKind = "normal" | "closed" | "special" | "short";

interface DayEntry {
  kind: DayKind;
  note?: string;
}

// date key: "YYYY-MM-DD"
type DayMap = Record<string, DayEntry>;

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

const KIND_LABELS: Record<DayKind, string> = {
  normal: "通常営業",
  closed: "定休日",
  special: "特別営業",
  short: "短縮営業",
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toKey(y: number, m: number, d: number) {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`;
}

function todayKey() {
  const t = new Date();
  return toKey(t.getFullYear(), t.getMonth(), t.getDate());
}

export default function CalendarPage() {
  const [days, setDays] = usePersistedState<DayMap>("v2_calendar_days_v1", {});
  const [events] = usePersisted(eventStore);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed

  const [modalKey, setModalKey] = useState<string | null>(null);
  const [modalKind, setModalKind] = useState<DayKind>("normal");
  const [modalNote, setModalNote] = useState("");

  const [bulkWeekday, setBulkWeekday] = useState(1); // 月曜デフォルト

  const today = todayKey();

  // ===== カレンダーグリッド生成 (日曜始まり) =====
  const cells = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const startWeekday = firstOfMonth.getDay(); // 0=日
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const list: { y: number; m: number; d: number; inMonth: boolean; key: string }[] = [];

    // 前月の埋め
    for (let i = 0; i < startWeekday; i++) {
      const d = daysInPrevMonth - startWeekday + 1 + i;
      const m = viewMonth === 0 ? 11 : viewMonth - 1;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      list.push({ y, m, d, inMonth: false, key: toKey(y, m, d) });
    }
    // 当月
    for (let d = 1; d <= daysInMonth; d++) {
      list.push({ y: viewYear, m: viewMonth, d, inMonth: true, key: toKey(viewYear, viewMonth, d) });
    }
    // 翌月の埋め (6週=42マスに揃える)
    const remain = 42 - list.length;
    for (let d = 1; d <= remain; d++) {
      const m = viewMonth === 11 ? 0 : viewMonth + 1;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      list.push({ y, m, d, inMonth: false, key: toKey(y, m, d) });
    }
    return list;
  }, [viewYear, viewMonth]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, typeof events>();
    for (const e of events) {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return map;
  }, [events]);

  // ===== サマリ =====
  const summary = useMemo(() => {
    let open = 0, closed = 0, special = 0, short = 0;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const key = toKey(viewYear, viewMonth, d);
      const kind = days[key]?.kind ?? "normal";
      if (kind === "closed") closed++;
      else if (kind === "special") { special++; open++; }
      else if (kind === "short") { short++; open++; }
      else open++;
    }
    return { open, closed, special, short, total: daysInMonth };
  }, [days, viewYear, viewMonth]);

  function goPrevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function goNextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }
  function goToday() {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  }

  function openDayModal(key: string) {
    const entry = days[key];
    setModalKind(entry?.kind ?? "normal");
    setModalNote(entry?.note ?? "");
    setModalKey(key);
  }

  function saveDayModal() {
    if (!modalKey) return;
    setDays(prev => {
      const next = { ...prev };
      if (modalKind === "normal" && !modalNote.trim()) {
        delete next[modalKey];
      } else {
        next[modalKey] = { kind: modalKind, note: modalNote.trim() || undefined };
      }
      return next;
    });
    setModalKey(null);
  }

  function applyBulkClosedWeekday() {
    const label = WEEKDAY_LABELS[bulkWeekday];
    if (!confirm(`${viewYear}年${viewMonth + 1}月の毎週${label}曜日を定休日に設定します。よろしいですか？`)) return;
    setDays(prev => {
      const next = { ...prev };
      const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(viewYear, viewMonth, d);
        if (date.getDay() === bulkWeekday) {
          const key = toKey(viewYear, viewMonth, d);
          const existingNote = next[key]?.note;
          next[key] = { kind: "closed", note: existingNote };
        }
      }
      return next;
    });
  }

  function kindDotVariant(kind: DayKind): "success" | "warn" | undefined {
    if (kind === "special") return "success";
    if (kind === "short") return "warn";
    return undefined;
  }

  function cellStyle(kind: DayKind, inMonth: boolean): CSSProperties {
    if (!inMonth) return { opacity: 0.35 };
    if (kind === "closed") return { background: "var(--v2-bg-alt)", opacity: 0.75 };
    if (kind === "special") return { background: "var(--v2-accent-soft)" };
    if (kind === "short") return { background: "var(--v2-warn-bg)" };
    return {};
  }

  return (
    <VStack gap={16}>
      <PageHeader
        title="営業カレンダー"
        sub="月ごとの営業区分・イベントを確認できます"
      />

      <Panel
        title={
          <HStack gap={8}>
            <Btn size="sm" onClick={goPrevMonth} aria-label="前月"><ChevronLeft size={14} /></Btn>
            <div className="v2-h2" style={{ minWidth: 120, textAlign: "center" }}>{viewYear}年 {viewMonth + 1}月</div>
            <Btn size="sm" onClick={goNextMonth} aria-label="次月"><ChevronRight size={14} /></Btn>
            <Btn size="sm" onClick={goToday}>今日</Btn>
          </HStack>
        }
        action={
          <HStack gap={8}>
            <select value={bulkWeekday} onChange={(e) => setBulkWeekday(parseInt(e.target.value))}>
              {WEEKDAY_LABELS.map((label, i) => (
                <option key={i} value={i}>{label}曜日</option>
              ))}
            </select>
            <Btn size="sm" onClick={applyBulkClosedWeekday}>毎週この曜日を定休日にする</Btn>
          </HStack>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {WEEKDAY_LABELS.map((label, i) => (
            <div
              key={label}
              style={{
                textAlign: "center",
                fontSize: 12,
                fontWeight: 600,
                color: i === 0 ? "var(--v2-danger)" : i === 6 ? "var(--v2-info)" : "var(--v2-text-sub)",
                padding: "4px 0",
              }}
            >
              {label}
            </div>
          ))}
          {cells.map((cell) => {
            const entry = days[cell.key];
            const kind = entry?.kind ?? "normal";
            const isToday = cell.key === today;
            const dayEvents = eventsByDate.get(cell.key) ?? [];
            return (
              <div
                key={cell.key}
                onClick={() => openDayModal(cell.key)}
                style={{
                  minHeight: 84,
                  border: isToday ? "2px solid var(--v2-accent)" : "1px solid var(--v2-border)",
                  borderRadius: "var(--v2-radius-sm)",
                  padding: 6,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  ...cellStyle(kind, cell.inMonth),
                }}
              >
                <HStack gap={4} style={{ justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 500, color: isToday ? "var(--v2-accent-text)" : undefined }}>
                    {cell.d}
                  </span>
                  {kind !== "normal" && <Dot variant={kindDotVariant(kind)} />}
                </HStack>
                {kind !== "normal" && (
                  <span style={{ fontSize: 10, color: "var(--v2-text-sub)", lineHeight: 1.3 }}>
                    {KIND_LABELS[kind]}
                  </span>
                )}
                {entry?.note && (
                  <span style={{ fontSize: 10, color: "var(--v2-text-mute)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {entry.note}
                  </span>
                )}
                {dayEvents.length > 0 && (
                  <VStack gap={2} style={{ marginTop: "auto" }}>
                    {dayEvents.slice(0, 2).map((ev) => (
                      <Link
                        key={ev.id}
                        href="/v2/events"
                        onClick={(e) => e.stopPropagation()}
                        title={ev.title}
                        className="v2-chip v2-chip-info"
                        style={{
                          display: "block",
                          maxWidth: "100%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ev.title}
                      </Link>
                    ))}
                    {dayEvents.length > 2 && (
                      <span style={{ fontSize: 10, color: "var(--v2-text-mute)" }}>+{dayEvents.length - 2}件</span>
                    )}
                  </VStack>
                )}
              </div>
            );
          })}
        </div>

        {/* 凡例 */}
        <HStack gap={16} style={{ marginTop: 16, flexWrap: "wrap", fontSize: 12, color: "var(--v2-text-sub)" }}>
          <HStack gap={6}><Dot />通常営業</HStack>
          <HStack gap={6}><Dot />定休日</HStack>
          <HStack gap={6}><Dot variant="success" />特別営業</HStack>
          <HStack gap={6}><Dot variant="warn" />短縮営業</HStack>
          <HStack gap={6}><CalendarDays size={12} />イベントあり(クリックで詳細へ)</HStack>
        </HStack>
      </Panel>

      <Kpis>
        <Kpi label="営業日数" value={`${summary.open}日`} sub={`うち特別営業 ${summary.special}日 / 短縮営業 ${summary.short}日`} />
        <Kpi label="定休日数" value={`${summary.closed}日`} />
        <Kpi label="当月日数" value={`${summary.total}日`} />
      </Kpis>

      <Modal
        open={modalKey !== null}
        onClose={() => setModalKey(null)}
        title={modalKey ? `${modalKey} の営業設定` : ""}
        footer={<><Btn onClick={() => setModalKey(null)}>キャンセル</Btn><Btn variant="primary" onClick={saveDayModal}>保存</Btn></>}
      >
        <VStack gap={16}>
          <Field label="営業区分">
            <select value={modalKind} onChange={(e) => setModalKind(e.target.value as DayKind)}>
              <option value="normal">通常営業</option>
              <option value="closed">定休日</option>
              <option value="special">特別営業</option>
              <option value="short">短縮営業</option>
            </select>
          </Field>
          <Field label="メモ" hint="例: 貸切、○○トナメ">
            <input value={modalNote} onChange={(e) => setModalNote(e.target.value)} placeholder="メモを入力" />
          </Field>
        </VStack>
      </Modal>
    </VStack>
  );
}
