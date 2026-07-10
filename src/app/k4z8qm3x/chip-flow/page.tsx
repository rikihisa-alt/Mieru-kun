"use client";

import { useMemo, useState } from "react";
import { usePersisted } from "@/lib/persist/store";
import { chipFlowStore, type ChipFlowEntry, type ChipFlowDirection, type ChipGameType } from "@/lib/v2/stores";
import { customerStore } from "@/lib/store/domain-stores";
import { PageHeader, Panel, Field, VStack, HStack, Btn, Kpis, Kpi, Empty, Tabs, Toast, useToast } from "@/components/v2/ui";
import { Trash2 } from "lucide-react";

// ===== 全角→半角数字変換 + 数字以外を除去 (src/app/k4z8qm3x/tables/page.tsx と同じパターン) =====
function toHalfWidthDigits(input: string): string {
  return input
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[^\d]/g, "");
}

const GAME_TYPES: ChipGameType[] = ["トナメ", "リング", "サイド", "BJ", "バカラ"];
const DIRECTION_LABEL: Record<ChipFlowDirection, string> = { out: "貸出", in: "回収", adjust: "調整" };
const DIRECTION_COLOR: Record<ChipFlowDirection, string> = { out: "var(--v2-accent)", in: "var(--v2-info)", adjust: "var(--v2-warn)" };
const WEEKDAY_LABEL = ["日", "月", "火", "水", "木", "金", "土"];

type Period = "day" | "week" | "month" | "year";

function pad2(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function toDateKey(d: Date) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function startOfWeek(d: Date) {
  const nd = new Date(d);
  const day = nd.getDay(); // 0=日
  nd.setDate(nd.getDate() - day);
  nd.setHours(0, 0, 0, 0);
  return nd;
}
function addDays(d: Date, n: number) { const nd = new Date(d); nd.setDate(nd.getDate() + n); return nd; }
function addMonths(d: Date, n: number) { const nd = new Date(d); nd.setMonth(nd.getMonth() + n); return nd; }
function addYears(d: Date, n: number) { const nd = new Date(d); nd.setFullYear(nd.getFullYear() + n); return nd; }

// entry の符号付き枚数 (顧客保有ベース: 貸出=+, 回収/調整減=-)。旧データ(signedAmount未設定)にも対応
function entrySigned(e: ChipFlowEntry): number {
  if (typeof e.signedAmount === "number") return e.signedAmount;
  return e.direction === "in" ? -e.amount : e.amount;
}
function entryDate(e: ChipFlowEntry): Date {
  if (e.createdAt) return new Date(e.createdAt);
  // date (YYYY-MM-DD) のみの旧データはその日の正午とみなす
  return new Date(`${e.date}T12:00:00`);
}

export default function ChipFlowPage() {
  const [entries, setEntries] = usePersisted(chipFlowStore);
  const [customers, setCustomers] = usePersisted(customerStore);

  // ---- 記録フォーム ----
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [gameType, setGameType] = useState<ChipGameType>("トナメ");
  const [direction, setDirection] = useState<ChipFlowDirection>("out");
  const [amountStr, setAmountStr] = useState("");
  const [note, setNote] = useState("");
  const { toast, show } = useToast();

  // ---- 推移グラフの期間タブ ----
  const [period, setPeriod] = useState<Period>("day");

  function pickCustomer(id: string) {
    setCustomerId(id);
    const c = customers.find(c => c.id === id);
    if (c) setCustomerName(c.nickname || c.name);
    else setCustomerName("");
  }

  function resetForm() {
    setCustomerId(""); setCustomerName(""); setGameType("トナメ"); setDirection("out"); setAmountStr(""); setNote("");
  }

  function submit() {
    const amount = parseInt(amountStr, 10);
    if (!amount || amount <= 0) return;
    const now = new Date();
    const signed = direction === "out" ? amount : -amount; // 貸出=保有+ / 回収・調整=保有-
    const entry: ChipFlowEntry = {
      id: `cf${Date.now()}`,
      date: toDateKey(now),
      category: gameType === "トナメ" ? "tournament" : gameType === "リング" ? "ring" : gameType === "バカラ" ? "baccarat" : gameType === "BJ" ? "bj" : "purchase_cash",
      direction: direction === "in" ? "in" : "out",
      amount,
      customer: customerName.trim() || undefined,
      customerId: customerId || undefined,
      gameType,
      flowDirection: direction,
      signedAmount: signed,
      note: note.trim() || undefined,
      createdAt: now.toISOString(),
    };
    setEntries(prev => [entry, ...prev]);

    if (customerId) {
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, chipBalance: c.chipBalance + signed } : c));
    }

    show(`${DIRECTION_LABEL[direction]} ${amount.toLocaleString()}枚を記録しました`);
    resetForm();
  }

  function cancelEntry(entry: ChipFlowEntry) {
    const ok = confirm(`この記録を取り消しますか？\n${entry.customer ?? "(顧客未紐付け)"} / ${DIRECTION_LABEL[entry.flowDirection ?? (entry.direction === "in" ? "in" : "out")]} ${entry.amount.toLocaleString()}枚`);
    if (!ok) return;
    setEntries(prev => prev.filter(e => e.id !== entry.id));
    if (entry.customerId) {
      const signed = entrySigned(entry);
      setCustomers(prev => prev.map(c => c.id === entry.customerId ? { ...c, chipBalance: c.chipBalance - signed } : c));
    }
  }

  // ---- 本日のKPI ----
  const todayKey = toDateKey(new Date());
  const todayEntries = useMemo(() => entries.filter(e => toDateKey(entryDate(e)) === todayKey), [entries, todayKey]);
  const todayOut = todayEntries.filter(e => (e.flowDirection ?? (e.direction === "in" ? "in" : "out")) === "out").reduce((s, e) => s + e.amount, 0);
  const todayIn = todayEntries.filter(e => (e.flowDirection ?? (e.direction === "in" ? "in" : "out")) === "in").reduce((s, e) => s + e.amount, 0);
  const todayNet = todayEntries.reduce((s, e) => s + entrySigned(e), 0);
  const totalHolding = useMemo(() => customers.reduce((s, c) => s + (c.chipBalance || 0), 0), [customers]);

  // ---- 推移グラフ用データ ----
  const trendData = useMemo(() => {
    const now = new Date();
    if (period === "day") {
      const days: { key: string; label: string; value: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = addDays(now, -i);
        const key = toDateKey(d);
        const value = entries.filter(e => toDateKey(entryDate(e)) === key).reduce((s, e) => s + entrySigned(e), 0);
        days.push({ key, label: `${d.getMonth() + 1}/${d.getDate()}`, value });
      }
      return days;
    }
    if (period === "week") {
      const weeks: { key: string; label: string; value: number }[] = [];
      const thisWeekStart = startOfWeek(now);
      for (let i = 11; i >= 0; i--) {
        const ws = addDays(thisWeekStart, -i * 7);
        const we = addDays(ws, 7);
        const value = entries.filter(e => { const d = entryDate(e); return d >= ws && d < we; }).reduce((s, e) => s + entrySigned(e), 0);
        weeks.push({ key: toDateKey(ws), label: `${ws.getMonth() + 1}/${ws.getDate()}`, value });
      }
      return weeks;
    }
    if (period === "month") {
      const months: { key: string; label: string; value: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const m = addMonths(new Date(now.getFullYear(), now.getMonth(), 1), -i);
        const value = entries.filter(e => { const d = entryDate(e); return d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth(); }).reduce((s, e) => s + entrySigned(e), 0);
        months.push({ key: `${m.getFullYear()}-${pad2(m.getMonth() + 1)}`, label: `${m.getFullYear()}/${m.getMonth() + 1}`, value });
      }
      return months;
    }
    // year: 直近5年
    const years: { key: string; label: string; value: number }[] = [];
    for (let i = 4; i >= 0; i--) {
      const y = now.getFullYear() - i;
      const value = entries.filter(e => entryDate(e).getFullYear() === y).reduce((s, e) => s + entrySigned(e), 0);
      years.push({ key: `${y}`, label: `${y}年`, value });
    }
    return years;
  }, [entries, period]);

  // ---- 曜日別 平均増減 ----
  const weekdayData = useMemo(() => {
    const sums = Array(7).fill(0) as number[];
    const counts = Array(7).fill(0) as number[];
    for (const e of entries) {
      const d = entryDate(e);
      sums[d.getDay()] += entrySigned(e);
      counts[d.getDay()] += 1;
    }
    return WEEKDAY_LABEL.map((label, i) => ({
      label,
      avg: counts[i] > 0 ? sums[i] / counts[i] : 0,
      count: counts[i],
    }));
  }, [entries]);

  // ---- ゲーム別内訳 ----
  const gameData = useMemo(() => {
    return GAME_TYPES.map(g => {
      const list = entries.filter(e => (e.gameType ?? guessGameType(e)) === g);
      const out = list.filter(e => (e.flowDirection ?? (e.direction === "in" ? "in" : "out")) === "out").reduce((s, e) => s + e.amount, 0);
      const inn = list.filter(e => (e.flowDirection ?? (e.direction === "in" ? "in" : "out")) === "in").reduce((s, e) => s + e.amount, 0);
      const net = list.reduce((s, e) => s + entrySigned(e), 0);
      return { game: g, out, in: inn, net, count: list.length };
    });
  }, [entries]);

  // ---- 保有ランキング ----
  const holdingRanking = useMemo(() => [...customers].filter(c => c.chipBalance > 0).sort((a, b) => b.chipBalance - a.chipBalance).slice(0, 10), [customers]);

  // ---- 履歴一覧 (直近50件) ----
  const history = useMemo(() => [...entries].sort((a, b) => entryDate(b).getTime() - entryDate(a).getTime()).slice(0, 50), [entries]);

  const trendMax = Math.max(1, ...trendData.map(d => Math.abs(d.value)));
  const weekdayMax = Math.max(1, ...weekdayData.map(d => Math.abs(d.avg)));
  const gameMax = Math.max(1, ...gameData.map(d => Math.max(d.out, d.in)));

  return (
    <VStack gap={16}>
      <PageHeader title="チップフロー" sub="客ごとの保有チップ・全体増減の多角的分析" />

      {toast && <Toast message={toast.message} variant={toast.variant} />}

      <Kpis>
        <Kpi label="本日 貸出計" value={todayOut.toLocaleString()} sub="枚" />
        <Kpi label="本日 回収計" value={todayIn.toLocaleString()} sub="枚" />
        <Kpi label="本日 純増減" value={(todayNet >= 0 ? "+" : "") + todayNet.toLocaleString()} sub="枚" />
        <Kpi label="店全体チップ在高" value={totalHolding.toLocaleString()} sub="枚(顧客保有合計)" />
      </Kpis>

      {/* ===== 記録フォーム ===== */}
      <Panel title="チップ増減を記録">
        <VStack gap={12}>
          <div className="v2-form-grid">
            <Field label="既存顧客">
              <select value={customerId} onChange={(e) => pickCustomer(e.target.value)}>
                <option value="">— 手入力 —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.nickname || c.name} (保有{c.chipBalance.toLocaleString()}枚)</option>)}
              </select>
            </Field>
            <Field label="顧客名" hint={customerId ? "既存顧客に紐付け中" : "手入力(残高は連動しません)"}>
              <input value={customerName} onChange={(e) => { setCustomerName(e.target.value); if (customerId) setCustomerId(""); }} placeholder="お名前" />
            </Field>
            <Field label="ゲーム種別">
              <select value={gameType} onChange={(e) => setGameType(e.target.value as ChipGameType)}>
                {GAME_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
          </div>
          <div className="v2-form-grid">
            <Field label="増減方向" required>
              <div style={{ display: "flex", gap: 6 }}>
                {(["out", "in", "adjust"] as ChipFlowDirection[]).map(d => (
                  <Btn key={d} size="sm" variant={direction === d ? "primary" : "default"} onClick={() => setDirection(d)} type="button">{DIRECTION_LABEL[d]}</Btn>
                ))}
              </div>
            </Field>
            <Field label="枚数" required>
              <input
                inputMode="numeric"
                value={amountStr}
                onChange={(e) => setAmountStr(toHalfWidthDigits(e.target.value))}
                placeholder="0"
                className="v2-num"
              />
            </Field>
            <Field label="メモ"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="任意" /></Field>
          </div>
          <HStack gap={8} style={{ justifyContent: "flex-end" }}>
            <Btn variant="primary" onClick={submit} disabled={!amountStr || parseInt(amountStr, 10) <= 0}>記録する</Btn>
          </HStack>
        </VStack>
      </Panel>

      {/* ===== 推移グラフ ===== */}
      <Panel title="純増減の推移" action={
        <Tabs value={period} onChange={(v) => setPeriod(v as Period)} items={[
          { value: "day", label: "日(直近14日)" },
          { value: "week", label: "週(直近12週)" },
          { value: "month", label: "月(直近12ヶ月)" },
          { value: "year", label: "年" },
        ]} />
      }>
        {entries.length === 0 ? <Empty>チップフローのデータを記録してから表示されます</Empty> : (
          <TrendChart data={trendData} max={trendMax} />
        )}
      </Panel>

      <div className="v2-form-grid">
        {/* ===== 曜日別 ===== */}
        <Panel title="曜日別 平均増減">
          {entries.length === 0 ? <Empty>データがありません</Empty> : (
            <VStack gap={8}>
              {weekdayData.map(d => (
                <WeekdayBar key={d.label} label={d.label} avg={d.avg} count={d.count} max={weekdayMax} />
              ))}
            </VStack>
          )}
        </Panel>

        {/* ===== ゲーム別 ===== */}
        <Panel title="ゲーム別 内訳">
          {entries.length === 0 ? <Empty>データがありません</Empty> : (
            <VStack gap={10}>
              {gameData.map(g => (
                <GameBar key={g.game} game={g.game} out={g.out} in={g.in} net={g.net} count={g.count} max={gameMax} />
              ))}
            </VStack>
          )}
        </Panel>
      </div>

      {/* ===== 保有ランキング ===== */}
      <Panel title="チップ保有ランキング">
        {holdingRanking.length === 0 ? <Empty>チップを保有している顧客がいません</Empty> : (
          <div className="v2-table-wrap">
            <table className="v2-table">
              <thead><tr><th style={{ width: 50 }}>順位</th><th>顧客</th><th className="v2-num-cell">保有チップ</th></tr></thead>
              <tbody>
                {holdingRanking.map((c, i) => (
                  <tr key={c.id}>
                    <td className="v2-num">{i + 1}</td>
                    <td>{c.nickname || c.name}</td>
                    <td className="v2-num-cell">{c.chipBalance.toLocaleString()}枚</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* ===== 履歴一覧 ===== */}
      <Panel title={`履歴 (直近${history.length}件)`}>
        {history.length === 0 ? <Empty>まだ記録がありません</Empty> : (
          <div className="v2-table-wrap">
            <table className="v2-table">
              <thead>
                <tr>
                  <th>日時</th><th>顧客</th><th>ゲーム</th><th>方向</th><th className="v2-num-cell">枚数</th><th>メモ</th><th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {history.map(e => {
                  const dir = e.flowDirection ?? (e.direction === "in" ? "in" : "out");
                  return (
                    <tr key={e.id}>
                      <td className="v2-mute" style={{ fontSize: 12 }}>{entryDate(e).toLocaleString("ja-JP")}</td>
                      <td>{e.customer ?? <span className="v2-mute">(未紐付け)</span>}</td>
                      <td className="v2-mute">{e.gameType ?? guessGameType(e)}</td>
                      <td><span style={{ color: DIRECTION_COLOR[dir], fontWeight: 600 }}>{DIRECTION_LABEL[dir]}</span></td>
                      <td className="v2-num-cell">{e.amount.toLocaleString()}</td>
                      <td className="v2-mute" style={{ fontSize: 12 }}>{e.note}</td>
                      <td>
                        <Btn variant="ghost" size="xs" onClick={() => cancelEntry(e)} title="取消" style={{ height: 26, width: 26, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                          <Trash2 size={13} />
                        </Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </VStack>
  );
}

// 旧カテゴリ(purchase_cash等)からゲーム種別を推定するフォールバック
function guessGameType(e: ChipFlowEntry): ChipGameType {
  switch (e.category) {
    case "tournament": return "トナメ";
    case "ring": return "リング";
    case "bj": return "BJ";
    case "baccarat": return "バカラ";
    default: return "サイド";
  }
}

// ===================== SVG グラフ部品 =====================

function TrendChart({ data, max }: { data: { key: string; label: string; value: number }[]; max: number }) {
  const W = 900, H = 220, padTop = 12, padBottom = 28, padX = 8;
  const barGap = 6;
  const barW = Math.max(4, (W - padX * 2) / data.length - barGap);
  const zeroY = padTop + (H - padTop - padBottom) / 2;
  const halfH = (H - padTop - padBottom) / 2;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ minWidth: 480 }}>
        <line x1={padX} y1={zeroY} x2={W - padX} y2={zeroY} stroke="var(--v2-border)" strokeWidth={1} />
        {data.map((d, i) => {
          const x = padX + i * ((W - padX * 2) / data.length) + barGap / 2;
          const h = max > 0 ? (Math.abs(d.value) / max) * halfH : 0;
          const y = d.value >= 0 ? zeroY - h : zeroY;
          const color = d.value >= 0 ? "var(--v2-accent)" : "var(--v2-danger)";
          return (
            <g key={d.key}>
              <rect x={x} y={y} width={barW} height={Math.max(0, h)} fill={color} rx={2} />
              <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize={10} fill="var(--v2-text-mute)">
                {data.length > 20 ? (i % 2 === 0 ? d.label : "") : d.label}
              </text>
              {d.value !== 0 && (
                <text
                  x={x + barW / 2}
                  y={d.value >= 0 ? y - 4 : y + h + 12}
                  textAnchor="middle"
                  fontSize={10}
                  fontFamily="var(--v2-num)"
                  fill="var(--v2-text-sub)"
                >
                  {d.value >= 0 ? `+${d.value.toLocaleString()}` : d.value.toLocaleString()}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function WeekdayBar({ label, avg, count, max }: { label: string; avg: number; count: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (Math.abs(avg) / max) * 100) : 0;
  const color = avg >= 0 ? "var(--v2-accent)" : "var(--v2-danger)";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 90px", alignItems: "center", gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, textAlign: "center" }}>{label}</div>
      <div style={{ background: "var(--v2-bg-alt)", borderRadius: 6, height: 14, position: "relative", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: 6 }} />
      </div>
      <div className="v2-num-cell" style={{ fontSize: 12 }}>
        {count === 0 ? "—" : `${avg >= 0 ? "+" : ""}${Math.round(avg).toLocaleString()}枚`}
      </div>
    </div>
  );
}

function GameBar({ game, out, in: inn, net, count, max }: { game: ChipGameType; out: number; in: number; net: number; count: number; max: number }) {
  const outPct = max > 0 ? Math.min(100, (out / max) * 100) : 0;
  const inPct = max > 0 ? Math.min(100, (inn / max) * 100) : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
        <span style={{ fontWeight: 600 }}>{game}</span>
        <span className="v2-num" style={{ color: net >= 0 ? "var(--v2-accent)" : "var(--v2-danger)" }}>
          {count === 0 ? "データなし" : `純${net >= 0 ? "+" : ""}${net.toLocaleString()}枚`}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <HStack gap={6}>
          <span className="v2-mute" style={{ fontSize: 10, width: 34 }}>貸出</span>
          <div style={{ flex: 1, background: "var(--v2-bg-alt)", borderRadius: 4, height: 10, overflow: "hidden" }}>
            <div style={{ width: `${outPct}%`, background: "var(--v2-accent)", height: "100%" }} />
          </div>
          <span className="v2-num" style={{ fontSize: 10, width: 60, textAlign: "right" }}>{out.toLocaleString()}</span>
        </HStack>
        <HStack gap={6}>
          <span className="v2-mute" style={{ fontSize: 10, width: 34 }}>回収</span>
          <div style={{ flex: 1, background: "var(--v2-bg-alt)", borderRadius: 4, height: 10, overflow: "hidden" }}>
            <div style={{ width: `${inPct}%`, background: "var(--v2-info)", height: "100%" }} />
          </div>
          <span className="v2-num" style={{ fontSize: 10, width: 60, textAlign: "right" }}>{inn.toLocaleString()}</span>
        </HStack>
      </div>
    </div>
  );
}
