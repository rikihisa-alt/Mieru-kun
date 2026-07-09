"use client";

import { useEffect, useRef, useState } from "react";
import { usePersistedState, usePersisted } from "@/lib/persist/store";
import { customerStore, type CustomerRecord } from "@/lib/store/domain-stores";
import { PageHeader, Btn, Panel, Field, Modal, VStack, HStack, Chip, Empty, Tabs } from "@/components/v2/ui";
import {
  Plus, Trash2, Pencil, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  Users, X, ChevronRight, Flag,
} from "lucide-react";

// ===================== 型定義 =====================
interface BlindLevel {
  id: string;
  level: number;
  sb: number;
  bb: number;
  ante: number;
  minutes: number;
}

type TournamentStatus = "preparing" | "running" | "finished";

interface Entrant {
  id: string;
  no: number;
  customerId: string | null;
  name: string;
  reentries: number;
  registeredAt: string;
}

interface ResultEntry {
  rank: number;
  entrantId: string;
  name: string;
  customerId: string | null;
  prize: number;
  itm: boolean;
}

interface TimerState {
  /** タイマー開始時刻 (ISO)。null = 未開始 */
  startedAt: string | null;
  /** 一時停止中の開始時刻 (ISO)。null = 稼働中 */
  pausedAt: string | null;
  /** これまでの一時停止合計 (ms) */
  pausedTotalMs: number;
  /** 現在のブラインドレベルの配列インデックス */
  levelIndex: number;
}

interface PrizeSettings {
  /** 店取り率 (%) */
  rakePercent: number;
  /** 配分プリセットキー */
  presetKey: string;
  /** 手動調整後の配分 (%): rank(1始まり) -> percent */
  distribution: { rank: number; percent: number }[];
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
  entrants: Entrant[];
  timer: TimerState;
  prize: PrizeSettings;
  results: ResultEntry[];
  soundOn: boolean;
  createdAt: string;
}

// ===================== プリセット =====================
const BLIND_PRESETS: { key: string; label: string; minutes: number; steps: { sb: number; bb: number; ante: number }[] }[] = [
  {
    key: "turbo15",
    label: "15分ターボ",
    minutes: 15,
    steps: [
      { sb: 25, bb: 50, ante: 0 },
      { sb: 50, bb: 100, ante: 0 },
      { sb: 75, bb: 150, ante: 150 },
      { sb: 100, bb: 200, ante: 200 },
      { sb: 150, bb: 300, ante: 300 },
      { sb: 200, bb: 400, ante: 400 },
      { sb: 300, bb: 600, ante: 600 },
      { sb: 400, bb: 800, ante: 800 },
      { sb: 500, bb: 1000, ante: 1000 },
      { sb: 700, bb: 1400, ante: 1400 },
      { sb: 1000, bb: 2000, ante: 2000 },
      { sb: 1500, bb: 3000, ante: 3000 },
    ],
  },
  {
    key: "standard20",
    label: "20分スタンダード",
    minutes: 20,
    steps: [
      { sb: 25, bb: 50, ante: 0 },
      { sb: 50, bb: 100, ante: 0 },
      { sb: 100, bb: 200, ante: 0 },
      { sb: 100, bb: 200, ante: 200 },
      { sb: 150, bb: 300, ante: 300 },
      { sb: 200, bb: 400, ante: 400 },
      { sb: 300, bb: 600, ante: 600 },
      { sb: 400, bb: 800, ante: 800 },
      { sb: 500, bb: 1000, ante: 1000 },
      { sb: 600, bb: 1200, ante: 1200 },
      { sb: 800, bb: 1600, ante: 1600 },
      { sb: 1000, bb: 2000, ante: 2000 },
    ],
  },
];

function buildLevelsFromPreset(presetKey: string): BlindLevel[] {
  const preset = BLIND_PRESETS.find((p) => p.key === presetKey);
  if (!preset) return [];
  return preset.steps.map((s, i) => ({
    id: `bl${Date.now()}_${i}`,
    level: i + 1,
    sb: s.sb, bb: s.bb, ante: s.ante,
    minutes: preset.minutes,
  }));
}

const PRIZE_PRESETS: { key: string; label: string; build: (n: number) => { rank: number; percent: number }[] }[] = [
  {
    key: "top3_50_30_20",
    label: "1位50 / 2位30 / 3位20",
    build: () => [{ rank: 1, percent: 50 }, { rank: 2, percent: 30 }, { rank: 3, percent: 20 }],
  },
  {
    key: "top15_itm",
    label: "上位15%配分 (ITM)",
    build: (n) => {
      const itmCount = Math.max(1, Math.round(n * 0.15));
      // 標準的な逓減配分 (合計100%になるよう正規化)
      const raw: number[] = [];
      for (let i = 0; i < itmCount; i++) raw.push(Math.pow(0.62, i));
      const sum = raw.reduce((a, b) => a + b, 0);
      return raw.map((r, i) => ({ rank: i + 1, percent: Math.round((r / sum) * 1000) / 10 }));
    },
  },
  {
    key: "winner_takes_all",
    label: "1位総取り",
    build: () => [{ rank: 1, percent: 100 }],
  },
];

// ===================== ステータス表示 =====================
const STATUS_LABEL: Record<TournamentStatus, string> = { preparing: "準備中", running: "開催中", finished: "終了" };
const STATUS_VARIANT: Record<TournamentStatus, "success" | "warn" | undefined> = { preparing: "warn", running: "success", finished: undefined };

// ===================== Web Audio ビープ =====================
let audioCtx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioCtx) return audioCtx;
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new Ctor();
    return audioCtx;
  } catch {
    return null;
  }
}
function tone(freq: number, duration: number, startOffset: number) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const t = ctx.currentTime + startOffset;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}
function playLevelUpBeep() {
  tone(660, 0.15, 0);
  tone(880, 0.2, 0.18);
}

// ===================== ユーティリティ =====================
function fmtMoney(n: number): string {
  return `¥${n.toLocaleString()}`;
}
function fmtClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}
function newId(prefix: string): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function emptyTournament(): Omit<TournamentRecord, "id" | "createdAt"> {
  return {
    name: "",
    date: "",
    buyIn: 5000,
    reentryAllowed: true,
    reentryMax: 2,
    startingStack: 20000,
    capacity: 30,
    status: "preparing",
    blindLevels: buildLevelsFromPreset("turbo15"),
    entrants: [],
    timer: { startedAt: null, pausedAt: null, pausedTotalMs: 0, levelIndex: 0 },
    prize: { rakePercent: 10, presetKey: "top3_50_30_20", distribution: PRIZE_PRESETS[0].build(0) },
    results: [],
    soundOn: true,
  };
}

// ===================== ページ =====================
export default function TournamentsPage() {
  const [tournaments, setTournaments] = usePersistedState<TournamentRecord[]>("v2_tournaments_v1", []);
  const [tab, setTab] = useState<"list" | "timer">("list");
  const [openId, setOpenId] = useState<string | null>(null);

  const openTournament = tournaments.find((t) => t.id === openId) ?? null;

  function update(id: string, fn: (t: TournamentRecord) => TournamentRecord) {
    setTournaments((prev) => prev.map((t) => (t.id === id ? fn(t) : t)));
  }

  // 開催中トナメを開いたらタイマータブへ自動遷移
  function openDetail(id: string) {
    setOpenId(id);
    const t = tournaments.find((x) => x.id === id);
    setTab(t?.status === "running" ? "timer" : "list");
  }

  return (
    <VStack gap={16}>
      <PageHeader title="トーナメント" sub={`${tournaments.length}件`} />

      {!openTournament ? (
        <TournamentListView
          tournaments={tournaments}
          setTournaments={setTournaments}
          onOpen={openDetail}
        />
      ) : (
        <TournamentDetailView
          tournament={openTournament}
          update={(fn) => update(openTournament.id, fn)}
          onClose={() => setOpenId(null)}
          tab={tab}
          setTab={setTab}
        />
      )}
    </VStack>
  );
}

// ===================== 一覧ビュー =====================
function TournamentListView({
  tournaments, setTournaments, onOpen,
}: {
  tournaments: TournamentRecord[];
  setTournaments: (next: TournamentRecord[] | ((prev: TournamentRecord[]) => TournamentRecord[])) => void;
  onOpen: (id: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [d, setD] = useState(emptyTournament());

  function openCreate() {
    setD(emptyTournament());
    setCreating(true);
  }
  function save() {
    if (!d.name.trim() || !d.date) return;
    const rec: TournamentRecord = { id: newId("tn"), createdAt: new Date().toISOString(), ...d };
    setTournaments((prev) => [rec, ...prev]);
    setCreating(false);
  }
  function remove(id: string) {
    if (!confirm("このトーナメントを削除しますか？参加者・結果情報も失われます。")) return;
    setTournaments((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <>
      <Panel action={<Btn variant="primary" onClick={openCreate}><Plus size={14} /> 新規トーナメント</Btn>}>
        {tournaments.length === 0 ? (
          <Empty>トーナメントがありません</Empty>
        ) : (
          <div className="v2-table-wrap">
            <table className="v2-table">
              <thead>
                <tr>
                  <th>名前</th><th>開催日</th><th className="v2-num-cell">バイイン</th>
                  <th className="v2-num-cell">参加</th><th>状態</th><th></th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map((t) => (
                  <tr key={t.id} style={{ cursor: "pointer" }} onClick={() => onOpen(t.id)}>
                    <td>{t.name}</td>
                    <td className="v2-sub">{t.date}</td>
                    <td className="v2-num-cell">{fmtMoney(t.buyIn)}</td>
                    <td className="v2-num-cell">{t.entrants.length} / {t.capacity}</td>
                    <td><Chip variant={STATUS_VARIANT[t.status]}>{STATUS_LABEL[t.status]}</Chip></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <Btn size="xs" onClick={() => onOpen(t.id)}><ChevronRight size={11} /> 詳細</Btn>{" "}
                      <Btn size="xs" variant="danger" onClick={() => remove(t.id)}><Trash2 size={11} /></Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="トーナメント新規作成"
        size="lg"
        footer={<><Btn onClick={() => setCreating(false)}>キャンセル</Btn><Btn variant="primary" onClick={save}>作成</Btn></>}
      >
        <VStack gap={16}>
          <Field label="名前" required><input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></Field>
          <div className="v2-form-grid">
            <Field label="開催日" required><input type="date" value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} /></Field>
            <Field label="参加定員"><input type="number" min={1} value={d.capacity} onChange={(e) => setD({ ...d, capacity: parseInt(e.target.value) || 0 })} /></Field>
            <Field label="バイイン(参加費)"><input type="number" min={0} value={d.buyIn} onChange={(e) => setD({ ...d, buyIn: parseInt(e.target.value) || 0 })} /></Field>
            <Field label="開始スタック"><input type="number" min={0} value={d.startingStack} onChange={(e) => setD({ ...d, startingStack: parseInt(e.target.value) || 0 })} /></Field>
            <Field label="リエントリー">
              <select value={d.reentryAllowed ? "1" : "0"} onChange={(e) => setD({ ...d, reentryAllowed: e.target.value === "1" })}>
                <option value="1">可</option><option value="0">不可</option>
              </select>
            </Field>
            {d.reentryAllowed && (
              <Field label="リエントリー上限(回)"><input type="number" min={0} value={d.reentryMax} onChange={(e) => setD({ ...d, reentryMax: parseInt(e.target.value) || 0 })} /></Field>
            )}
          </div>
          <BlindStructureEditor
            levels={d.blindLevels}
            onChange={(levels) => setD({ ...d, blindLevels: levels })}
          />
        </VStack>
      </Modal>
    </>
  );
}

// ===================== ブラインドストラクチャ編集 =====================
function BlindStructureEditor({ levels, onChange }: { levels: BlindLevel[]; onChange: (levels: BlindLevel[]) => void }) {
  function applyPreset(key: string) {
    onChange(buildLevelsFromPreset(key));
  }
  function updateLevel(id: string, patch: Partial<BlindLevel>) {
    onChange(levels.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function addLevel() {
    const last = levels[levels.length - 1];
    onChange([
      ...levels,
      {
        id: newId("bl"),
        level: levels.length + 1,
        sb: last ? last.sb * 2 : 25,
        bb: last ? last.bb * 2 : 50,
        ante: last ? last.ante * 2 : 0,
        minutes: last ? last.minutes : 15,
      },
    ]);
  }
  function removeLevel(id: string) {
    const filtered = levels.filter((l) => l.id !== id);
    onChange(filtered.map((l, i) => ({ ...l, level: i + 1 })));
  }

  return (
    <Field label="ブラインドストラクチャ">
      <HStack gap={8} style={{ marginBottom: 8, flexWrap: "wrap" }}>
        {BLIND_PRESETS.map((p) => (
          <Btn key={p.key} size="xs" onClick={() => applyPreset(p.key)}>{p.label}を生成</Btn>
        ))}
        <Btn size="xs" onClick={addLevel}><Plus size={11} /> レベル追加</Btn>
      </HStack>
      <div className="v2-table-wrap" style={{ maxHeight: 280, overflowY: "auto", border: "1px solid var(--v2-border)", borderRadius: 8 }}>
        <table className="v2-table">
          <thead>
            <tr>
              <th style={{ width: 48 }}>Lv</th>
              <th className="v2-num-cell">SB</th>
              <th className="v2-num-cell">BB</th>
              <th className="v2-num-cell">Ante</th>
              <th className="v2-num-cell">時間(分)</th>
              <th style={{ width: 32 }}></th>
            </tr>
          </thead>
          <tbody>
            {levels.map((l) => (
              <tr key={l.id}>
                <td className="v2-num">{l.level}</td>
                <td className="v2-num-cell"><input type="number" min={0} value={l.sb} onChange={(e) => updateLevel(l.id, { sb: parseInt(e.target.value) || 0 })} style={{ width: 72, textAlign: "right" }} /></td>
                <td className="v2-num-cell"><input type="number" min={0} value={l.bb} onChange={(e) => updateLevel(l.id, { bb: parseInt(e.target.value) || 0 })} style={{ width: 72, textAlign: "right" }} /></td>
                <td className="v2-num-cell"><input type="number" min={0} value={l.ante} onChange={(e) => updateLevel(l.id, { ante: parseInt(e.target.value) || 0 })} style={{ width: 72, textAlign: "right" }} /></td>
                <td className="v2-num-cell"><input type="number" min={1} value={l.minutes} onChange={(e) => updateLevel(l.id, { minutes: parseInt(e.target.value) || 1 })} style={{ width: 64, textAlign: "right" }} /></td>
                <td><Btn size="xs" variant="danger" onClick={() => removeLevel(l.id)}><Trash2 size={11} /></Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
        {levels.length === 0 && <Empty>レベルがありません。プリセットから生成してください</Empty>}
      </div>
    </Field>
  );
}

// ===================== 詳細ビュー (タブ: 一覧/タイマー) =====================
function TournamentDetailView({
  tournament, update, onClose, tab, setTab,
}: {
  tournament: TournamentRecord;
  update: (fn: (t: TournamentRecord) => TournamentRecord) => void;
  onClose: () => void;
  tab: "list" | "timer";
  setTab: (t: "list" | "timer") => void;
}) {
  return (
    <VStack gap={16}>
      <HStack gap={12} style={{ justifyContent: "space-between" }}>
        <HStack gap={10}>
          <Btn size="sm" onClick={onClose}><X size={12} /> 一覧へ戻る</Btn>
          <span className="v2-h2" style={{ margin: 0 }}>{tournament.name}</span>
          <Chip variant={STATUS_VARIANT[tournament.status]}>{STATUS_LABEL[tournament.status]}</Chip>
        </HStack>
        <StatusControls tournament={tournament} update={update} />
      </HStack>

      <Tabs
        value={tab}
        onChange={(v) => setTab(v as "list" | "timer")}
        items={[
          { value: "list", label: "概要・参加者" },
          { value: "timer", label: "開催中タイマー" },
        ]}
      />

      {tab === "list" ? (
        <OverviewTab tournament={tournament} update={update} />
      ) : (
        <TimerTab tournament={tournament} update={update} />
      )}
    </VStack>
  );
}

function StatusControls({ tournament, update }: { tournament: TournamentRecord; update: (fn: (t: TournamentRecord) => TournamentRecord) => void }) {
  function startTournament() {
    update((t) => ({
      ...t,
      status: "running",
      timer: { startedAt: new Date().toISOString(), pausedAt: null, pausedTotalMs: 0, levelIndex: 0 },
    }));
  }
  function finishTournament() {
    if (!confirm("トーナメントを終了しますか？")) return;
    update((t) => ({ ...t, status: "finished" }));
  }
  function backToPreparing() {
    update((t) => ({ ...t, status: "preparing" }));
  }

  if (tournament.status === "preparing") {
    return <Btn variant="primary" onClick={startTournament} disabled={tournament.entrants.length === 0}><Play size={14} /> 開催開始</Btn>;
  }
  if (tournament.status === "running") {
    return <Btn variant="danger" onClick={finishTournament}><Flag size={14} /> 終了する</Btn>;
  }
  return <Btn onClick={backToPreparing}>準備中に戻す</Btn>;
}

// ===================== 概要・参加者タブ =====================
function OverviewTab({ tournament, update }: { tournament: TournamentRecord; update: (fn: (t: TournamentRecord) => TournamentRecord) => void }) {
  const [customers, setCustomers] = usePersisted(customerStore);
  const [nameInput, setNameInput] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [editingLevels, setEditingLevels] = useState(false);

  const entrantCount = tournament.entrants.length;
  const reentryCount = tournament.entrants.reduce((s, e) => s + e.reentries, 0);
  const prizePool = tournament.buyIn * (entrantCount + reentryCount);
  const rakeAmount = Math.round(prizePool * (tournament.prize.rakePercent / 100));
  const distributable = prizePool - rakeAmount;

  function addEntrant() {
    const cust = customers.find((c) => c.id === customerId);
    const name = cust ? (cust.nickname || cust.name) : nameInput.trim();
    if (!name) return;
    if (tournament.capacity && entrantCount >= tournament.capacity) {
      alert(`定員(${tournament.capacity}名)に達しています`);
      return;
    }
    const entrant: Entrant = {
      id: newId("ent"),
      no: entrantCount + 1,
      customerId: cust?.id ?? null,
      name,
      reentries: 0,
      registeredAt: new Date().toISOString(),
    };
    update((t) => ({ ...t, entrants: [...t.entrants, entrant] }));
    setNameInput("");
    setCustomerId("");
  }
  function removeEntrant(id: string) {
    if (!confirm("この参加者を取り消しますか？")) return;
    update((t) => ({ ...t, entrants: t.entrants.filter((e) => e.id !== id) }));
  }
  function reentry(id: string) {
    update((t) => ({
      ...t,
      entrants: t.entrants.map((e) => (e.id === id
        ? (!t.reentryAllowed || e.reentries >= t.reentryMax ? e : { ...e, reentries: e.reentries + 1 })
        : e)),
    }));
  }

  return (
    <VStack gap={16}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <Panel title="定義">
          <VStack gap={6}>
            <Row label="開催日" value={tournament.date} />
            <Row label="バイイン" value={fmtMoney(tournament.buyIn)} />
            <Row label="開始スタック" value={tournament.startingStack.toLocaleString()} />
            <Row label="リエントリー" value={tournament.reentryAllowed ? `可 (上限${tournament.reentryMax}回)` : "不可"} />
            <Row label="定員" value={`${tournament.capacity}名`} />
          </VStack>
        </Panel>
        <Panel title="参加状況">
          <VStack gap={6}>
            <Row label="参加人数" value={`${entrantCount}名`} />
            <Row label="リエントリー数" value={`${reentryCount}回`} />
            <Row label="合計エントリー" value={`${entrantCount + reentryCount}`} />
          </VStack>
        </Panel>
        <Panel title="プライズプール">
          <VStack gap={6}>
            <Row label="プール総額" value={fmtMoney(prizePool)} />
            <Row label={`店取り(${tournament.prize.rakePercent}%)`} value={`- ${fmtMoney(rakeAmount)}`} />
            <Row label="配分対象額" value={fmtMoney(distributable)} strong />
          </VStack>
        </Panel>
        <Panel title="状態">
          <VStack gap={6}>
            <Row label="ステータス" value={STATUS_LABEL[tournament.status]} />
            <Row label="結果記録" value={`${tournament.results.length}名`} />
          </VStack>
        </Panel>
      </div>

      <Panel title="ブラインドストラクチャ" action={<Btn size="xs" onClick={() => setEditingLevels(true)} disabled={tournament.status !== "preparing"}><Pencil size={11} /> 編集</Btn>}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {tournament.blindLevels.map((l, i) => (
            <span
              key={l.id}
              className="v2-chip"
              style={{
                fontFamily: "var(--v2-num)", fontVariantNumeric: "tabular-nums",
                borderColor: i === tournament.timer.levelIndex && tournament.status === "running" ? "var(--v2-success)" : undefined,
              }}
            >
              Lv{l.level} {l.sb}/{l.bb}{l.ante ? `(${l.ante})` : ""} · {l.minutes}分
            </span>
          ))}
          {tournament.blindLevels.length === 0 && <span className="v2-mute">未設定</span>}
        </div>
      </Panel>

      <Panel title="参加受付" action={<span className="v2-mute" style={{ fontSize: 12 }}>{entrantCount} / {tournament.capacity}名</span>}>
        <VStack gap={12}>
          {tournament.status === "preparing" && (
            <HStack gap={8} style={{ flexWrap: "wrap" }}>
              <select value={customerId} onChange={(e) => { setCustomerId(e.target.value); setNameInput(""); }} style={{ flex: "1 1 200px", minWidth: 0 }}>
                <option value="">-- 顧客を選択 --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.nickname || c.name}</option>
                ))}
              </select>
              <span className="v2-mute" style={{ fontSize: 12 }}>または</span>
              <input
                placeholder="名前を直接入力"
                value={nameInput}
                onChange={(e) => { setNameInput(e.target.value); setCustomerId(""); }}
                style={{ flex: "1 1 160px", minWidth: 0 }}
              />
              <Btn variant="primary" size="sm" onClick={addEntrant}><Plus size={12} /> 参加登録</Btn>
            </HStack>
          )}

          {tournament.entrants.length === 0 ? (
            <Empty>参加者がいません</Empty>
          ) : (
            <div className="v2-table-wrap">
              <table className="v2-table">
                <thead>
                  <tr><th style={{ width: 48 }}>No</th><th>名前</th><th className="v2-num-cell">リエントリー</th><th></th></tr>
                </thead>
                <tbody>
                  {tournament.entrants.map((e) => (
                    <tr key={e.id}>
                      <td className="v2-num">{e.no}</td>
                      <td>{e.name}{e.customerId && <Users size={11} style={{ marginLeft: 6, verticalAlign: -1, opacity: 0.5 }} />}</td>
                      <td className="v2-num-cell">{e.reentries}{tournament.reentryAllowed ? ` / ${tournament.reentryMax}` : ""}</td>
                      <td>
                        {tournament.status === "preparing" && tournament.reentryAllowed && (
                          <Btn size="xs" onClick={() => reentry(e.id)} disabled={e.reentries >= tournament.reentryMax}>リエントリー</Btn>
                        )}{" "}
                        {tournament.status === "preparing" && (
                          <Btn size="xs" variant="danger" onClick={() => removeEntrant(e.id)}><Trash2 size={11} /></Btn>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </VStack>
      </Panel>

      <PrizeSettingsPanel tournament={tournament} update={update} prizePool={distributable} />

      {tournament.status === "finished" && (
        <ResultsPanel tournament={tournament} />
      )}
      {tournament.status !== "finished" && tournament.entrants.length > 0 && (
        <RecordResultsPanel tournament={tournament} update={update} setCustomers={setCustomers} prizePool={distributable} />
      )}

      <Modal
        open={editingLevels}
        onClose={() => setEditingLevels(false)}
        title="ブラインドストラクチャ編集"
        size="lg"
        footer={<Btn variant="primary" onClick={() => setEditingLevels(false)}>閉じる</Btn>}
      >
        <BlindStructureEditor
          levels={tournament.blindLevels}
          onChange={(levels) => update((t) => ({ ...t, blindLevels: levels }))}
        />
      </Modal>
    </VStack>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
      <span className="v2-mute">{label}</span>
      <span className="v2-num" style={{ fontWeight: strong ? 700 : 500 }}>{value}</span>
    </div>
  );
}

// ===================== プライズ配分設定 =====================
function PrizeSettingsPanel({ tournament, update, prizePool }: { tournament: TournamentRecord; update: (fn: (t: TournamentRecord) => TournamentRecord) => void; prizePool: number }) {
  function applyPreset(key: string) {
    const preset = PRIZE_PRESETS.find((p) => p.key === key);
    if (!preset) return;
    const dist = preset.build(tournament.entrants.length || 1);
    update((t) => ({ ...t, prize: { ...t.prize, presetKey: key, distribution: dist } }));
  }
  function setRake(v: number) {
    update((t) => ({ ...t, prize: { ...t.prize, rakePercent: v } }));
  }
  function updatePercent(rank: number, percent: number) {
    update((t) => ({
      ...t,
      prize: { ...t.prize, distribution: t.prize.distribution.map((d) => (d.rank === rank ? { ...d, percent } : d)) },
    }));
  }
  const totalPercent = tournament.prize.distribution.reduce((s, d) => s + d.percent, 0);

  return (
    <Panel title="プライズ配分">
      <VStack gap={12}>
        <HStack gap={12} style={{ flexWrap: "wrap" }}>
          <Field label="店取り率(%)">
            <input type="number" min={0} max={100} value={tournament.prize.rakePercent} onChange={(e) => setRake(parseInt(e.target.value) || 0)} style={{ width: 90 }} />
          </Field>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end", flexWrap: "wrap" }}>
            {PRIZE_PRESETS.map((p) => (
              <Btn key={p.key} size="xs" onClick={() => applyPreset(p.key)}>{p.label}</Btn>
            ))}
          </div>
        </HStack>

        <div className="v2-table-wrap">
          <table className="v2-table">
            <thead><tr><th style={{ width: 80 }}>順位</th><th className="v2-num-cell">配分(%)</th><th className="v2-num-cell">金額</th></tr></thead>
            <tbody>
              {tournament.prize.distribution.sort((a, b) => a.rank - b.rank).map((d) => (
                <tr key={d.rank}>
                  <td>{d.rank}位</td>
                  <td className="v2-num-cell">
                    <input
                      type="number" min={0} max={100} value={d.percent}
                      onChange={(e) => updatePercent(d.rank, parseFloat(e.target.value) || 0)}
                      style={{ width: 72, textAlign: "right" }}
                    />
                  </td>
                  <td className="v2-num-cell">{fmtMoney(Math.round(prizePool * (d.percent / 100)))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 12 }} className={totalPercent > 100 ? undefined : "v2-mute"}>
          配分合計: <span className="v2-num" style={{ color: totalPercent > 100 ? "var(--v2-danger)" : undefined, fontWeight: 700 }}>{totalPercent}%</span>
          {totalPercent > 100 && " (100%を超えています)"}
        </div>
      </VStack>
    </Panel>
  );
}

// ===================== 順位記録 (未終了時に記録可能) =====================
function RecordResultsPanel({
  tournament, update, setCustomers, prizePool,
}: {
  tournament: TournamentRecord;
  update: (fn: (t: TournamentRecord) => TournamentRecord) => void;
  setCustomers: (next: CustomerRecord[] | ((prev: CustomerRecord[]) => CustomerRecord[])) => void;
  prizePool: number;
}) {
  const remaining = tournament.entrants.filter((e) => !tournament.results.some((r) => r.entrantId === e.id));
  const nextRank = tournament.results.length + 1;

  function recordRank(entrantId: string) {
    const entrant = tournament.entrants.find((e) => e.id === entrantId);
    if (!entrant) return;
    const dist = tournament.prize.distribution.find((d) => d.rank === nextRank);
    const prize = dist ? Math.round(prizePool * (dist.percent / 100)) : 0;
    const result: ResultEntry = {
      rank: nextRank, entrantId: entrant.id, name: entrant.name, customerId: entrant.customerId,
      prize, itm: !!dist && dist.percent > 0,
    };
    update((t) => ({ ...t, results: [...t.results, result] }));

    if (entrant.customerId && prize > 0) {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "/");
      setCustomers((prev) => prev.map((c) => (c.id === entrant.customerId
        ? { ...c, prizeCount: c.prizeCount + 1, lastPrize: today }
        : c)));
    }
  }
  function undoLast() {
    if (tournament.results.length === 0) return;
    if (!confirm("直近の記録を取り消しますか？")) return;
    update((t) => ({ ...t, results: t.results.slice(0, -1) }));
  }

  return (
    <Panel title="順位記録" action={tournament.results.length > 0 ? <Btn size="xs" onClick={undoLast}>直近を取消</Btn> : undefined}>
      <VStack gap={12}>
        {tournament.results.length > 0 && (
          <div className="v2-table-wrap">
            <table className="v2-table">
              <thead><tr><th style={{ width: 60 }}>順位</th><th>名前</th><th className="v2-num-cell">獲得プライズ</th><th></th></tr></thead>
              <tbody>
                {tournament.results.map((r) => (
                  <tr key={r.entrantId}>
                    <td className="v2-num">{r.rank}</td>
                    <td>{r.name}</td>
                    <td className="v2-num-cell">{fmtMoney(r.prize)}</td>
                    <td>{r.itm && <Chip variant="success">ITM</Chip>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {remaining.length === 0 ? (
          <Empty>全員の順位を記録しました</Empty>
        ) : (
          <VStack gap={8}>
            <div className="v2-mute" style={{ fontSize: 12 }}>{nextRank}位を選択してください</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {remaining.map((e) => (
                <Btn key={e.id} size="sm" onClick={() => recordRank(e.id)}>{e.name}</Btn>
              ))}
            </div>
          </VStack>
        )}
      </VStack>
    </Panel>
  );
}

function ResultsPanel({ tournament }: { tournament: TournamentRecord }) {
  return (
    <Panel title="最終結果">
      {tournament.results.length === 0 ? (
        <Empty>結果が記録されていません</Empty>
      ) : (
        <div className="v2-table-wrap">
          <table className="v2-table">
            <thead><tr><th style={{ width: 60 }}>順位</th><th>名前</th><th className="v2-num-cell">獲得プライズ</th><th></th></tr></thead>
            <tbody>
              {tournament.results.map((r) => (
                <tr key={r.entrantId}>
                  <td className="v2-num">{r.rank}</td>
                  <td>{r.name}</td>
                  <td className="v2-num-cell">{fmtMoney(r.prize)}</td>
                  <td>{r.itm && <Chip variant="success">ITM</Chip>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

// ===================== タイマータブ =====================
function TimerTab({ tournament, update }: { tournament: TournamentRecord; update: (fn: (t: TournamentRecord) => TournamentRecord) => void }) {
  const [now, setNow] = useState(() => Date.now());
  const lastLevelIndexRef = useRef(tournament.timer.levelIndex);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const running = tournament.status === "running";
  const levels = tournament.blindLevels;
  const { timer } = tournament;
  const isPaused = timer.pausedAt !== null;
  const startMs = timer.startedAt ? new Date(timer.startedAt).getTime() : now;
  const pausedExtraMs = isPaused ? now - new Date(timer.pausedAt!).getTime() : 0;
  const effectiveNow = now - timer.pausedTotalMs - pausedExtraMs;
  const elapsedMs = Math.max(0, effectiveNow - startMs);

  // 現在レベルの残り時間を、レベルインデックスとレベル境界の累積時間から算出
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
  const nextLevel = levels[computedIndex + 1];

  // レベル自動遷移をタイマーレコードに反映 (表示専用計算と実データを同期)
  useEffect(() => {
    if (!running) return;
    if (computedIndex !== timer.levelIndex) {
      if (computedIndex > lastLevelIndexRef.current && tournament.soundOn) {
        playLevelUpBeep();
      }
      lastLevelIndexRef.current = computedIndex;
      update((t) => ({ ...t, timer: { ...t.timer, levelIndex: computedIndex } }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, computedIndex]);

  if (!running) {
    return (
      <Panel>
        <Empty>トーナメントを「開催開始」すると、ここにブラインドタイマーが表示されます</Empty>
      </Panel>
    );
  }

  const warn = remainSec <= 60;

  function togglePause() {
    update((t) => {
      if (t.timer.pausedAt) {
        // 再開: 一時停止していた分を累計に加算
        const pausedMs = Date.now() - new Date(t.timer.pausedAt).getTime();
        return { ...t, timer: { ...t.timer, pausedAt: null, pausedTotalMs: t.timer.pausedTotalMs + pausedMs } };
      }
      return { ...t, timer: { ...t.timer, pausedAt: new Date().toISOString() } };
    });
  }
  function shiftLevel(delta: number) {
    update((t) => {
      const idx = Math.max(0, Math.min(t.blindLevels.length - 1, t.timer.levelIndex + delta));
      // 該当レベルの開始時点に合わせて startedAt を再計算 (経過=そのレベル開始点)
      let msAtLevelStart = 0;
      for (let i = 0; i < idx; i++) msAtLevelStart += t.blindLevels[i].minutes * 60 * 1000;
      const newStartedAt = new Date(Date.now() - msAtLevelStart).toISOString();
      lastLevelIndexRef.current = idx;
      return { ...t, timer: { startedAt: newStartedAt, pausedAt: t.timer.pausedAt ? new Date().toISOString() : null, pausedTotalMs: 0, levelIndex: idx } };
    });
  }
  function toggleSound() {
    update((t) => ({ ...t, soundOn: !t.soundOn }));
  }

  return (
    <VStack gap={16}>
      <Panel>
        <VStack gap={20}>
          <div style={{ textAlign: "center" }}>
            <div className="v2-mute" style={{ fontSize: 13, marginBottom: 4 }}>レベル {currentLevel?.level ?? "-"}</div>
            <div
              className="v2-num"
              style={{
                fontSize: 64, fontWeight: 800, lineHeight: 1,
                color: warn ? "var(--v2-danger)" : "var(--v2-text)",
                animation: warn ? "v2-blink 1s ease-in-out infinite" : undefined,
              }}
            >
              {fmtClock(remainSec)}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16 }}>
              <BigStat label="SB" value={currentLevel?.sb ?? 0} />
              <BigStat label="BB" value={currentLevel?.bb ?? 0} />
              <BigStat label="Ante" value={currentLevel?.ante ?? 0} />
            </div>
          </div>

          <HStack gap={10} style={{ justifyContent: "center" }}>
            <Btn onClick={() => shiftLevel(-1)} disabled={timer.levelIndex === 0}><SkipBack size={14} /> 前のレベル</Btn>
            <Btn variant="primary" onClick={togglePause}>
              {isPaused ? <><Play size={14} /> 再開</> : <><Pause size={14} /> 一時停止</>}
            </Btn>
            <Btn onClick={() => shiftLevel(1)} disabled={timer.levelIndex >= levels.length - 1}>次のレベル <SkipForward size={14} /></Btn>
            <Btn onClick={toggleSound}>{tournament.soundOn ? <><Volume2 size={14} /> 音ON</> : <><VolumeX size={14} /> 音OFF</>}</Btn>
          </HStack>
          {isPaused && <div style={{ textAlign: "center" }}><Chip variant="warn">一時停止中</Chip></div>}
        </VStack>
      </Panel>

      {nextLevel && (
        <Panel title="次のレベル">
          <HStack gap={16}>
            <span className="v2-mute" style={{ fontSize: 13 }}>Lv{nextLevel.level}</span>
            <span className="v2-num" style={{ fontSize: 15, fontWeight: 700 }}>
              SB {nextLevel.sb.toLocaleString()} / BB {nextLevel.bb.toLocaleString()}{nextLevel.ante ? ` / Ante ${nextLevel.ante.toLocaleString()}` : ""}
            </span>
            <span className="v2-mute" style={{ fontSize: 12 }}>{nextLevel.minutes}分</span>
          </HStack>
        </Panel>
      )}

      <Panel title="全レベル">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {levels.map((l, i) => (
            <span
              key={l.id}
              className="v2-chip"
              style={{
                fontFamily: "var(--v2-num)", fontVariantNumeric: "tabular-nums",
                opacity: i < computedIndex ? 0.4 : 1,
                borderColor: i === computedIndex ? "var(--v2-success)" : undefined,
                fontWeight: i === computedIndex ? 700 : 400,
              }}
            >
              Lv{l.level} {l.sb}/{l.bb}{l.ante ? `(${l.ante})` : ""} · {l.minutes}分
            </span>
          ))}
        </div>
      </Panel>
    </VStack>
  );
}

function BigStat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div className="v2-mute" style={{ fontSize: 11 }}>{label}</div>
      <div className="v2-num" style={{ fontSize: 24, fontWeight: 700 }}>{value.toLocaleString()}</div>
    </div>
  );
}
