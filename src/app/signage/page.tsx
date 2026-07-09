"use client";

import { useEffect, useMemo, useState } from "react";
import { usePersistedState } from "@/lib/persist/store";
import type { CustomerRank } from "@/lib/store/domain-stores";

// =================================================================
// サイネージモード (店内大画面用フルスクリーン表示)
// 既存の /v2 管理画面と localStorage + BroadcastChannel で自動同期される。
// 型定義は各ストアの実データ構造 (v2/tables, v2/tournaments, v2/settings) に合わせている。
// =================================================================

// ----- 卓管理 (src/app/v2/tables/page.tsx と同一構造) -----
interface Visit {
  id: string;
  customerId: string | null;
  name: string;
  rank: CustomerRank;
  checkedInAt: string;
  tableId?: string;
  seatIndex?: number;
}
interface TableDef {
  id: string;
  name: string;
  type: "トナメ" | "リング" | "サイド" | "BJ" | "バカラ";
  maxSeats: number;
  dealer?: string;
  dealerDurationMin?: number;
  dealerStartedAt?: string;
  posX?: number;
  posY?: number;
}
type WaitStatus = "waiting" | "called";
interface WaitEntry {
  id: string;
  name: string;
  partySize: number;
  game: TableDef["type"] | "指定なし";
  registeredAt: string;
  status: WaitStatus;
  calledAt?: string;
  visitId?: string;
}

// ----- トーナメント (src/app/v2/tournaments/page.tsx と同一構造) -----
interface BlindLevel {
  id: string;
  level: number;
  sb: number;
  bb: number;
  ante: number;
  minutes: number;
}
type TournamentStatus = "preparing" | "running" | "finished";
interface TimerState {
  startedAt: string | null;
  pausedAt: string | null;
  pausedTotalMs: number;
  levelIndex: number;
}
interface TournamentRecord {
  id: string;
  name: string;
  date: string;
  buyIn: number;
  reentryAllowed: boolean;
  reentryMax: number;
  startingStack: number;
  capacity: number;
  status: TournamentStatus;
  blindLevels: BlindLevel[];
  entrants: unknown[];
  timer: TimerState;
  soundOn: boolean;
  createdAt: string;
}

// ----- 店舗設定 (StoreSettings の一部。storeName のみ使用) -----
interface StoreSettingsLite {
  storeName: string;
}
const DEFAULT_SETTINGS_LITE: StoreSettingsLite = { storeName: "" };

// ----- イベント (src/lib/store/domain-stores.ts EventRecord と同一構造) -----
interface EventRecord {
  id: string;
  title: string;
  category: "tournament" | "party" | "campaign";
  date: string;
  time: string;
  capacity: number;
  reservedCount: number;
  fee?: number;
  note?: string;
  status: "draft" | "open" | "closed";
  createdAt: string;
}

const TYPE_COLOR: Record<TableDef["type"], string> = {
  "トナメ": "#34d399", "リング": "#22c55e", "サイド": "#94a3b8", "BJ": "#60a5fa", "バカラ": "#c084fc",
};

function fmtClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export default function SignagePage() {
  const [settings] = usePersistedState<StoreSettingsLite>("tempo_settings_v1", DEFAULT_SETTINGS_LITE);
  const [tables] = usePersistedState<TableDef[]>("v2_tables_v2", []);
  const [visits] = usePersistedState<Visit[]>("v2_visits_v1", []);
  const [waitlist] = usePersistedState<WaitEntry[]>("v2_waitlist_v1", []);
  const [tournaments] = usePersistedState<TournamentRecord[]>("v2_tournaments_v1", []);
  const [events] = usePersistedState<EventRecord[]>("tempo_events_v1", []);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const timeLabel = now.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  const dateLabel = now.toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" });

  const waitingCount = useMemo(() => waitlist.filter((w) => w.status === "waiting" || w.status === "called").length, [waitlist]);

  const runningTournament = useMemo(
    () => tournaments.find((t) => t.status === "running") ?? null,
    [tournaments]
  );

  const openEvents = useMemo(
    () => events.filter((e) => e.status === "open").sort((a, b) => a.date.localeCompare(b.date)),
    [events]
  );

  const seatedCountByTable = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of visits) {
      if (!v.tableId) continue;
      map.set(v.tableId, (map.get(v.tableId) ?? 0) + 1);
    }
    return map;
  }, [visits]);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        cursor: "none",
        background: "radial-gradient(circle at 50% 0%, #163326 0%, #0a1712 55%, #050b08 100%)",
        color: "#eafff1",
        fontFamily: "var(--font-noto-jp, 'Noto Sans JP'), sans-serif",
        display: "flex",
        flexDirection: "column",
        padding: "2.2vw 2.6vw",
        boxSizing: "border-box",
        gap: "1.6vw",
        overflow: "hidden",
      }}
    >
      {/* ===== ヘッダー ===== */}
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          borderBottom: "0.15vw solid rgba(255,255,255,0.12)",
          paddingBottom: "1vw",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "1.2vw" }}>
          <span style={{ fontSize: "3.2vw", fontWeight: 800, letterSpacing: "0.02em", color: "#f0fff6" }}>
            {settings.storeName || "てんぽみえるくん"}
          </span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "3.6vw", fontWeight: 800, fontVariantNumeric: "tabular-nums", lineHeight: 1, color: "#ffffff" }}>
            {timeLabel}
          </div>
          <div style={{ fontSize: "1.1vw", color: "rgba(234,255,241,0.65)", marginTop: "0.3vw" }}>{dateLabel}</div>
        </div>
      </header>

      {/* ===== 開催中トナメ (あれば最優先で表示) ===== */}
      {runningTournament && <TournamentBanner tournament={runningTournament} />}

      {/* ===== メインコンテンツ: 卓状況 + サイド情報 ===== */}
      <div style={{ display: "flex", gap: "1.6vw", flex: 1, minHeight: 0 }}>
        <div style={{ flex: 3, minWidth: 0, display: "flex", flexDirection: "column", gap: "1vw" }}>
          <SectionLabel>卓状況</SectionLabel>
          {tables.length === 0 ? (
            <div style={{ fontSize: "1.4vw", color: "rgba(234,255,241,0.5)" }}>卓が登録されていません</div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(15vw, 1fr))",
                gap: "1.1vw",
                overflowY: "auto",
              }}
            >
              {tables.map((t) => (
                <TableCard key={t.id} table={t} seatedCount={seatedCountByTable.get(t.id) ?? 0} />
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: "18vw", display: "flex", flexDirection: "column", gap: "1.4vw" }}>
          <WaitingPanel count={waitingCount} />
        </div>
      </div>

      {/* ===== イベント告知 (下部ティッカー風) ===== */}
      <EventTicker events={openEvents} />
    </div>
  );
}

// ===================== 卓カード =====================
function TableCard({ table, seatedCount }: { table: TableDef; seatedCount: number }) {
  const full = seatedCount >= table.maxSeats;
  const empty = seatedCount === 0;
  const bg = full
    ? "linear-gradient(160deg, rgba(127,29,29,0.55), rgba(69,10,10,0.55))"
    : "linear-gradient(160deg, rgba(6,78,59,0.55), rgba(2,44,34,0.55))";
  const borderColor = full ? "rgba(248,113,113,0.55)" : empty ? "rgba(52,211,153,0.7)" : "rgba(52,211,153,0.35)";

  return (
    <div
      style={{
        background: bg,
        border: `0.14vw solid ${borderColor}`,
        borderRadius: "1vw",
        padding: "1.1vw 1.2vw",
        display: "flex",
        flexDirection: "column",
        gap: "0.5vw",
        boxShadow: "0 0.4vw 1.2vw rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "1.5vw", fontWeight: 800, color: "#fff" }}>{table.name}</span>
        <span
          style={{
            fontSize: "0.85vw", fontWeight: 700, padding: "0.15vw 0.6vw", borderRadius: "999px",
            background: `${TYPE_COLOR[table.type]}33`, color: TYPE_COLOR[table.type],
          }}
        >
          {table.type}
        </span>
      </div>
      <div
        style={{
          fontSize: "2.4vw",
          fontWeight: 800,
          fontVariantNumeric: "tabular-nums",
          color: full ? "#fca5a5" : empty ? "#6ee7b7" : "#eafff1",
        }}
      >
        {seatedCount} <span style={{ fontSize: "1.3vw", fontWeight: 500, color: "rgba(234,255,241,0.55)" }}>/ {table.maxSeats}席</span>
      </div>
      <div style={{ fontSize: "0.95vw", fontWeight: 600, color: full ? "#fca5a5" : "#6ee7b7" }}>
        {full ? "満卓" : "空席あり"}
      </div>
    </div>
  );
}

// ===================== ウェイティングパネル =====================
function WaitingPanel({ count }: { count: number }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "0.12vw solid rgba(255,255,255,0.12)",
        borderRadius: "1vw",
        padding: "1.4vw",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        gap: "0.6vw",
        justifyContent: "center",
      }}
    >
      <SectionLabel center>ウェイティング</SectionLabel>
      {count > 0 ? (
        <>
          <div style={{ fontSize: "3vw", fontWeight: 800, color: "#fbbf24", lineHeight: 1 }}>
            {count}<span style={{ fontSize: "1.3vw", fontWeight: 600 }}>組</span>
          </div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#fde68a" }}>ただいま{count}組待ちです</div>
        </>
      ) : (
        <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#6ee7b7", padding: "1vw 0" }}>
          すぐにご案内できます
        </div>
      )}
    </div>
  );
}

// ===================== トーナメントバナー =====================
function TournamentBanner({ tournament }: { tournament: TournamentRecord }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const levels = tournament.blindLevels;
  const { timer } = tournament;
  const isPaused = timer.pausedAt !== null;
  const startMs = timer.startedAt ? new Date(timer.startedAt).getTime() : now;
  const pausedExtraMs = isPaused ? now - new Date(timer.pausedAt!).getTime() : 0;
  const effectiveNow = now - timer.pausedTotalMs - pausedExtraMs;
  const elapsedMs = Math.max(0, effectiveNow - startMs);

  // 現在レベルの残り時間を、レベルインデックスとレベル境界の累積時間から算出
  // (src/app/v2/tournaments/page.tsx TimerTab と同一計算式)
  let cursorMs = 0;
  let computedIndex = 0;
  for (let i = 0; i < levels.length; i++) {
    const durMs = levels[i].minutes * 60 * 1000;
    if (elapsedMs < cursorMs + durMs || i === levels.length - 1) {
      computedIndex = i;
      break;
    }
    cursorMs += durMs;
  }
  const levelStartMs = cursorMs;
  const currentLevel = levels[computedIndex] ?? levels[levels.length - 1];
  const levelDurMs = (currentLevel?.minutes ?? 0) * 60 * 1000;
  const levelElapsedMs = Math.max(0, elapsedMs - levelStartMs);
  const remainMs = Math.max(0, levelDurMs - levelElapsedMs);
  const remainSec = Math.ceil(remainMs / 1000);
  const warn = remainSec <= 60;

  return (
    <div
      style={{
        background: "linear-gradient(120deg, rgba(124,58,237,0.28), rgba(6,78,59,0.35))",
        border: "0.14vw solid rgba(196,181,253,0.4)",
        borderRadius: "1vw",
        padding: "1vw 1.6vw",
        display: "flex",
        alignItems: "center",
        gap: "2vw",
        boxShadow: "0 0.4vw 1.4vw rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.95vw", fontWeight: 700, color: "#c4b5fd", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          開催中トーナメント
        </div>
        <div style={{ fontSize: "2.1vw", fontWeight: 800, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {tournament.name}
        </div>
        {isPaused && (
          <div style={{ fontSize: "1vw", fontWeight: 700, color: "#fbbf24", marginTop: "0.2vw" }}>一時停止中</div>
        )}
      </div>

      <div style={{ display: "flex", gap: "1.6vw", alignItems: "center" }}>
        <BlindStat label="SB" value={currentLevel?.sb ?? 0} />
        <BlindStat label="BB" value={currentLevel?.bb ?? 0} />
        <BlindStat label="Ante" value={currentLevel?.ante ?? 0} />
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "0.85vw", color: "rgba(234,255,241,0.6)", fontWeight: 600 }}>
          レベル{currentLevel?.level ?? "-"} 残り
        </div>
        <div
          style={{
            fontSize: "3.4vw", fontWeight: 800, fontVariantNumeric: "tabular-nums", lineHeight: 1,
            color: warn ? "#f87171" : "#fff",
            animation: warn && !isPaused ? "signage-blink 1s ease-in-out infinite" : undefined,
          }}
        >
          {fmtClock(remainSec)}
        </div>
      </div>
      <style>{`@keyframes signage-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }`}</style>
    </div>
  );
}

function BlindStat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "0.85vw", color: "rgba(234,255,241,0.55)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: "1.7vw", fontWeight: 800, fontVariantNumeric: "tabular-nums", color: "#fff" }}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

// ===================== イベントティッカー =====================
const EVENT_CATEGORY_LABEL: Record<EventRecord["category"], string> = {
  tournament: "トーナメント", party: "パーティ", campaign: "キャンペーン",
};

function EventTicker({ events }: { events: EventRecord[] }) {
  if (events.length === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        gap: "1vw",
        overflowX: "auto",
        borderTop: "0.1vw solid rgba(255,255,255,0.12)",
        paddingTop: "1vw",
      }}
    >
      {events.map((e) => (
        <div
          key={e.id}
          style={{
            flex: "0 0 auto",
            minWidth: "20vw",
            background: "rgba(255,255,255,0.06)",
            border: "0.1vw solid rgba(255,255,255,0.14)",
            borderRadius: "0.8vw",
            padding: "0.8vw 1.2vw",
            display: "flex",
            alignItems: "center",
            gap: "1vw",
          }}
        >
          <span
            style={{
              fontSize: "0.8vw", fontWeight: 700, padding: "0.2vw 0.7vw", borderRadius: "999px",
              background: "rgba(52,211,153,0.18)", color: "#6ee7b7", whiteSpace: "nowrap",
            }}
          >
            {EVENT_CATEGORY_LABEL[e.category]}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "1.15vw", fontWeight: 800, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {e.title}
            </div>
            <div style={{ fontSize: "0.85vw", color: "rgba(234,255,241,0.6)" }}>
              {e.date} {e.time}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===================== 共通 =====================
function SectionLabel({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div
      style={{
        fontSize: "1vw",
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "rgba(234,255,241,0.5)",
        textAlign: center ? "center" : "left",
      }}
    >
      {children}
    </div>
  );
}
