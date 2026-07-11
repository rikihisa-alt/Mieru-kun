"use client";

import { useEffect, useMemo, useState } from "react";
import { usePersistedState } from "@/lib/persist/store";
import type { CustomerRank } from "@/lib/store/domain-stores";

// =================================================================
// サイネージモード (店内大画面用フルスクリーン表示)
// 既存の /k4z8qm3x 管理画面と localStorage + BroadcastChannel で自動同期される。
// 型定義は各ストアの実データ構造 (v2/tables, v2/tournaments, v2/settings) に合わせている。
// =================================================================

// ----- 卓管理 (src/app/k4z8qm3x/tables/page.tsx と同一構造) -----
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
  type: "トナメ" | "トナメ1" | "トナメ2" | "リング" | "サイド" | "BJ" | "バカラ" | "その他";
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

// ----- トーナメント (src/app/k4z8qm3x/tournaments/page.tsx と同一構造) -----
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
  "トナメ": "#34d399", "トナメ1": "#4ade80", "トナメ2": "#6ee7b7",
  "リング": "#22c55e", "サイド": "#94a3b8", "BJ": "#60a5fa", "バカラ": "#c084fc",
  "その他": "#94a3b8",
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
        background: "#f5faf6",
        color: "#1c2e26",
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
          background: "#d4e8dc",
          border: "1px solid #c3dccc",
          borderRadius: "1vw",
          padding: "1vw 1.6vw",
          boxShadow: "0 1px 2px rgba(28,46,36,0.05), 0 8px 24px rgba(28,46,36,0.10)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "1.2vw" }}>
          <span style={{ fontSize: "clamp(24px, 3.2vw, 62px)", fontWeight: 800, letterSpacing: "0.02em", color: "#1d7350" }}>
            {settings.storeName || "てんぽみえるくん"}
          </span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "clamp(28px, 3.6vw, 70px)", fontWeight: 800, fontVariantNumeric: "tabular-nums", lineHeight: 1, color: "#1c2e26" }}>
            {timeLabel}
          </div>
          <div style={{ fontSize: "1.1vw", color: "#4a5961", marginTop: "0.3vw" }}>{dateLabel}</div>
        </div>
      </header>

      {/* ===== 開催中トナメ (あれば最優先で表示) ===== */}
      {runningTournament && <TournamentBanner tournament={runningTournament} />}

      {/* ===== メインコンテンツ: 卓状況 + サイド情報 ===== */}
      <div style={{ display: "flex", gap: "1.6vw", flex: 1, minHeight: 0 }}>
        <div style={{ flex: 3, minWidth: 0, display: "flex", flexDirection: "column", gap: "1vw" }}>
          <SectionLabel>卓状況</SectionLabel>
          {tables.length === 0 ? (
            <div style={{ fontSize: "1.4vw", color: "#8e9ba3" }}>卓が登録されていません</div>
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
  // 状態色: 満卓=danger, 空きあり=success (v2トークンと同値)
  const statusColor = full ? "#c43d3d" : "#1b8a5a";
  const statusBg = full ? "#fbecec" : "#e6f5ee";
  const borderColor = full ? "#f0c6c6" : empty ? "#a9dcc0" : "rgba(28,46,36,0.08)";

  return (
    <div
      style={{
        background: "#ffffff",
        border: `1px solid ${borderColor}`,
        borderRadius: "14px",
        padding: "1.1vw 1.2vw",
        display: "flex",
        flexDirection: "column",
        gap: "0.5vw",
        boxShadow: "0 1px 2px rgba(28,46,36,0.05), 0 8px 24px rgba(28,46,36,0.10)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "clamp(14px, 1.5vw, 30px)", fontWeight: 800, color: "#1c2e26" }}>{table.name}</span>
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
          fontSize: "clamp(20px, 2.4vw, 48px)",
          fontWeight: 800,
          fontVariantNumeric: "tabular-nums",
          color: full ? "#c43d3d" : empty ? "#1b8a5a" : "#1c2e26",
        }}
      >
        {seatedCount} <span style={{ fontSize: "1.3vw", fontWeight: 500, color: "#8e9ba3" }}>/ {table.maxSeats}席</span>
      </div>
      <div
        style={{
          fontSize: "0.95vw",
          fontWeight: 700,
          color: statusColor,
          background: statusBg,
          borderRadius: "999px",
          padding: "0.15vw 0.7vw",
          display: "inline-block",
          width: "fit-content",
        }}
      >
        {full ? "満卓" : "空席あり"}
      </div>
      {table.dealer && (
        <div style={{ fontSize: "0.75vw", color: "#4a5961", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          D: {table.dealer}
        </div>
      )}
    </div>
  );
}

// ===================== ウェイティングパネル =====================
function WaitingPanel({ count }: { count: number }) {
  return (
    <div
      style={{
        background: count > 0 ? "#fbf2e1" : "#ffffff",
        border: count > 0 ? "1px solid #ecd6ab" : "1px solid rgba(28,46,36,0.08)",
        borderRadius: "14px",
        padding: "1.4vw",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        gap: "0.6vw",
        justifyContent: "center",
        boxShadow: "0 1px 2px rgba(28,46,36,0.05), 0 8px 24px rgba(28,46,36,0.10)",
      }}
    >
      <SectionLabel center>ウェイティング</SectionLabel>
      {count > 0 ? (
        <>
          <div style={{ fontSize: "clamp(24px, 3vw, 58px)", fontWeight: 800, color: "#b8772a", lineHeight: 1 }}>
            {count}<span style={{ fontSize: "1.3vw", fontWeight: 600 }}>組</span>
          </div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#b8772a" }}>ただいま{count}組待ちです</div>
        </>
      ) : (
        <div style={{ fontSize: "clamp(14px, 1.5vw, 30px)", fontWeight: 700, color: "#1b8a5a", padding: "1vw 0" }}>
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
  // (src/app/k4z8qm3x/tournaments/page.tsx TimerTab と同一計算式)
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
        background: "#d8efe2",
        border: "1px solid #a9dcc0",
        borderRadius: "14px",
        padding: "1vw 1.6vw",
        display: "flex",
        alignItems: "center",
        gap: "2vw",
        boxShadow: "0 1px 2px rgba(28,46,36,0.06), 0 16px 40px rgba(28,46,36,0.16)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.95vw", fontWeight: 700, color: "#1d7350", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          開催中トーナメント
        </div>
        <div style={{ fontSize: "clamp(18px, 2.1vw, 42px)", fontWeight: 800, color: "#1c2e26", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {tournament.name}
        </div>
        {isPaused && (
          <div style={{ fontSize: "1vw", fontWeight: 700, color: "#b8772a", marginTop: "0.2vw" }}>一時停止中</div>
        )}
      </div>

      <div style={{ display: "flex", gap: "1.6vw", alignItems: "center" }}>
        <BlindStat label="SB" value={currentLevel?.sb ?? 0} />
        <BlindStat label="BB" value={currentLevel?.bb ?? 0} />
        <BlindStat label="Ante" value={currentLevel?.ante ?? 0} />
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "0.85vw", color: "#4a5961", fontWeight: 600 }}>
          レベル{currentLevel?.level ?? "-"} 残り
        </div>
        <div
          style={{
            fontSize: "clamp(28px, 3.4vw, 66px)", fontWeight: 800, fontVariantNumeric: "tabular-nums", lineHeight: 1,
            color: warn ? "#c43d3d" : "#1c2e26",
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
      <div style={{ fontSize: "0.85vw", color: "#4a5961", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: "clamp(15px, 1.7vw, 34px)", fontWeight: 800, fontVariantNumeric: "tabular-nums", color: "#1c2e26" }}>
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
        borderTop: "1px solid rgba(28,46,36,0.08)",
        paddingTop: "1vw",
      }}
    >
      {events.map((e) => (
        <div
          key={e.id}
          style={{
            flex: "0 0 auto",
            minWidth: "20vw",
            background: "#ffffff",
            border: "1px solid rgba(28,46,36,0.08)",
            borderRadius: "0.8vw",
            padding: "0.8vw 1.2vw",
            display: "flex",
            alignItems: "center",
            gap: "1vw",
            boxShadow: "0 1px 2px rgba(28,46,36,0.05), 0 8px 24px rgba(28,46,36,0.10)",
          }}
        >
          <span
            style={{
              fontSize: "0.8vw", fontWeight: 700, padding: "0.2vw 0.7vw", borderRadius: "999px",
              background: "#d8efe2", color: "#1d7350", whiteSpace: "nowrap",
            }}
          >
            {EVENT_CATEGORY_LABEL[e.category]}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "1.15vw", fontWeight: 800, color: "#1c2e26", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {e.title}
            </div>
            <div style={{ fontSize: "0.85vw", color: "#4a5961" }}>
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
        color: "#8e9ba3",
        textAlign: center ? "center" : "left",
      }}
    >
      {children}
    </div>
  );
}
