"use client";

import { useMemo, useState } from "react";
import { usePersisted, usePersistedState } from "@/lib/persist/store";
import { visitLogStore, salesOrderStore, stockMovementStore } from "@/lib/v2/stores";
import { PageHeader, Panel, VStack, Empty, FilterChips } from "@/components/v2/ui";
import {
  LogIn, LogOut, ShoppingCart, CreditCard, Banknote, Package, Send, Clock, Search,
} from "lucide-react";

// =================================================================
// 履歴ページ: 各ストアを読み取り専用で集約し、時系列タイムラインとして表示
// =================================================================

type EventKind = "visit_in" | "visit_out" | "order" | "settle" | "credit_paid" | "stock" | "distribute" | "attendance";
type EventCategory = "visit" | "sales" | "stock" | "distribute" | "attendance";

interface TimelineEvent {
  id: string;
  at: string; // ISO or parseable date string
  ts: number; // sort key
  kind: EventKind;
  category: EventCategory;
  title: string;
  detail?: string;
  amount?: number;
}

// マルチケ配布履歴の型 (src/app/v2/multike/page.tsx と同一形状)
interface DistributionHistory {
  id: string;
  at: string; // toLocaleString("ja-JP") 済み文字列
  targetLabel: string;
  amount: number;
  targetCount: number;
  totalAmount: number;
  reason: string;
}

// 勤怠レコードの型 (src/app/v2/attendance/page.tsx と同一形状)
interface AttendanceRecord {
  staffId: string;
  date: string;     // YYYY-MM-DD
  clockIn?: string;  // HH:MM
  clockOut?: string;
  breakMin: number;
}

const REASON_LABEL: Record<string, string> = {
  purchase: "仕入",
  sold: "販売",
  adjust: "調整",
  waste: "廃棄",
};

function safeTs(dateLike: string): number {
  const t = new Date(dateLike).getTime();
  return Number.isFinite(t) ? t : 0;
}

function formatDateTime(ts: number): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function dateKey(ts: number): string {
  if (!ts) return "不明";
  const d = new Date(ts);
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
}

const CATEGORY_LABEL: Record<EventCategory, string> = {
  visit: "入退店",
  sales: "注文・精算",
  stock: "在庫",
  distribute: "配布",
  attendance: "勤怠",
};

const RANGE_OPTIONS = [
  { value: "today", label: "本日" },
  { value: "7d", label: "7日" },
  { value: "30d", label: "30日" },
  { value: "all", label: "全て" },
] as const;
type RangeValue = typeof RANGE_OPTIONS[number]["value"];

const MAX_EVENTS = 500;

function KindIcon({ kind }: { kind: EventKind }) {
  const size = 14;
  switch (kind) {
    case "visit_in": return <LogIn size={size} />;
    case "visit_out": return <LogOut size={size} />;
    case "order": return <ShoppingCart size={size} />;
    case "settle": return <CreditCard size={size} />;
    case "credit_paid": return <Banknote size={size} />;
    case "stock": return <Package size={size} />;
    case "distribute": return <Send size={size} />;
    case "attendance": return <Clock size={size} />;
    default: return null;
  }
}

const CATEGORY_COLOR: Record<EventCategory, { fg: string; bg: string }> = {
  visit: { fg: "var(--v2-info)", bg: "var(--v2-info-bg)" },
  sales: { fg: "var(--v2-success)", bg: "var(--v2-success-bg)" },
  stock: { fg: "var(--v2-warn)", bg: "var(--v2-warn-bg)" },
  distribute: { fg: "var(--v2-accent-text)", bg: "var(--v2-accent-soft)" },
  attendance: { fg: "var(--v2-text-sub)", bg: "var(--v2-bg-alt)" },
};

export default function HistoryPage() {
  const [visitLogs] = usePersisted(visitLogStore);
  const [orders] = usePersisted(salesOrderStore);
  const [stockMovements] = usePersisted(stockMovementStore);
  const [multikeHistory] = usePersistedState<DistributionHistory[]>("v2_multike_history_v1", []);
  const [attendance] = usePersistedState<AttendanceRecord[]>("v2_attendance_v1", []);

  const [category, setCategory] = useState<EventCategory | "all">("all");
  const [range, setRange] = useState<RangeValue>("7d");
  const [query, setQuery] = useState("");

  const events = useMemo<TimelineEvent[]>(() => {
    const list: TimelineEvent[] = [];

    // 入退店
    for (const v of visitLogs) {
      list.push({
        id: `visitin-${v.id}`,
        at: v.checkedInAt,
        ts: safeTs(v.checkedInAt),
        kind: "visit_in",
        category: "visit",
        title: `${v.customerName || "不明な顧客"} 様が来店`,
        detail: [v.table ? `卓: ${v.table}` : null, v.rank ? `ランク: ${v.rank}` : null].filter(Boolean).join(" / ") || undefined,
      });
      if (v.checkedOutAt) {
        list.push({
          id: `visitout-${v.id}`,
          at: v.checkedOutAt,
          ts: safeTs(v.checkedOutAt),
          kind: "visit_out",
          category: "visit",
          title: `${v.customerName || "不明な顧客"} 様が退店`,
          detail: v.table ? `卓: ${v.table}` : undefined,
          amount: v.spent,
        });
      }
    }

    // 注文 / 精算 / 後払い消し込み
    for (const o of orders) {
      const itemsDetail = o.items.map(i => `${i.name}×${i.qty}`).join("、");
      list.push({
        id: `order-${o.id}`,
        at: o.createdAt,
        ts: safeTs(o.createdAt),
        kind: "order",
        category: "sales",
        title: `${o.customer || "不明な顧客"} 様の注文`,
        detail: [o.table ? `卓: ${o.table}` : null, itemsDetail || null].filter(Boolean).join(" / ") || undefined,
        amount: o.total,
      });
      if (o.status === "settled" && o.settledAt) {
        list.push({
          id: `settle-${o.id}`,
          at: o.settledAt,
          ts: safeTs(o.settledAt),
          kind: "settle",
          category: "sales",
          title: `${o.customer || "不明な顧客"} 様の精算`,
          detail: [o.table ? `卓: ${o.table}` : null, o.paymentMethod ? `方法: ${o.paymentMethod}` : null].filter(Boolean).join(" / ") || undefined,
          amount: o.total,
        });
      }
      if (o.paymentMethod === "credit" && o.paidAt) {
        list.push({
          id: `creditpaid-${o.id}`,
          at: o.paidAt,
          ts: safeTs(o.paidAt),
          kind: "credit_paid",
          category: "sales",
          title: `${o.customer || "不明な顧客"} 様の後払い消し込み`,
          detail: o.paidMethod ? `方法: ${o.paidMethod}` : undefined,
          amount: o.total,
        });
      }
    }

    // 在庫移動
    for (const s of stockMovements) {
      const sign = s.delta > 0 ? "+" : "";
      list.push({
        id: `stock-${s.id}`,
        at: s.createdAt,
        ts: safeTs(s.createdAt),
        kind: "stock",
        category: "stock",
        title: `${s.productName || "不明な商品"} の在庫移動`,
        detail: [
          `${REASON_LABEL[s.reason] ?? s.reason} ${sign}${s.delta}`,
          `残: ${s.balanceAfter}`,
          s.reasonNote || null,
          s.performedBy ? `担当: ${s.performedBy}` : null,
        ].filter(Boolean).join(" / "),
      });
    }

    // マルチケ配布
    for (const h of multikeHistory) {
      list.push({
        id: `multike-${h.id}`,
        at: h.at,
        ts: safeTs(h.at),
        kind: "distribute",
        category: "distribute",
        title: `マルチケ配布: ${h.targetLabel}`,
        detail: [`${h.targetCount}名 × ${h.amount}枚`, h.reason || null].filter(Boolean).join(" / "),
        amount: h.totalAmount,
      });
    }

    // 出退勤
    for (const r of attendance) {
      if (r.clockIn) {
        const at = `${r.date}T${r.clockIn}:00`;
        list.push({
          id: `clockin-${r.staffId}-${r.date}`,
          at,
          ts: safeTs(at),
          kind: "attendance",
          category: "attendance",
          title: `出勤 (${r.staffId})`,
          detail: r.date,
        });
      }
      if (r.clockOut) {
        const at = `${r.date}T${r.clockOut}:00`;
        list.push({
          id: `clockout-${r.staffId}-${r.date}`,
          at,
          ts: safeTs(at),
          kind: "attendance",
          category: "attendance",
          title: `退勤 (${r.staffId})`,
          detail: r.date,
        });
      }
    }

    list.sort((a, b) => b.ts - a.ts);
    return list;
  }, [visitLogs, orders, stockMovements, multikeHistory, attendance]);

  const rangeStart = useMemo(() => {
    const now = new Date();
    if (range === "all") return 0;
    if (range === "today") {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return d.getTime();
    }
    const days = range === "7d" ? 7 : 30;
    return now.getTime() - days * 24 * 60 * 60 * 1000;
  }, [range]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter(e => {
      if (category !== "all" && e.category !== category) return false;
      if (rangeStart && e.ts < rangeStart) return false;
      if (q) {
        const hay = `${e.title} ${e.detail ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, category, rangeStart, query]);

  const truncated = filtered.length > MAX_EVENTS;
  const visible = truncated ? filtered.slice(0, MAX_EVENTS) : filtered;

  const groups = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    for (const e of visible) {
      const key = dateKey(e.ts);
      const arr = map.get(key);
      if (arr) arr.push(e);
      else map.set(key, [e]);
    }
    return Array.from(map.entries());
  }, [visible]);

  return (
    <VStack gap={16}>
      <PageHeader title="履歴" sub="入退店・注文・精算・在庫・配布・勤怠の時系列" />

      <div className="v2-toolbar">
        <FilterChips
          value={category}
          onChange={(v) => setCategory(v as EventCategory | "all")}
          items={[{ value: "all", label: "全て" }, ...(Object.keys(CATEGORY_LABEL) as EventCategory[]).map(c => ({ value: c, label: CATEGORY_LABEL[c] }))]}
        />
        <FilterChips value={range} onChange={(v) => setRange(v as RangeValue)} items={RANGE_OPTIONS.map(r => ({ value: r.value, label: r.label }))} />
        <div className="v2-toolbar__search">
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--v2-text-mute)" }} />
          <input
            type="text"
            placeholder="顧客名・商品名などで検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: 30 }}
          />
        </div>
        <span className="v2-mute" style={{ fontSize: 12, marginLeft: "auto" }}>
          {filtered.length.toLocaleString()}件
          {truncated && <span style={{ marginLeft: 6 }}>(最新{MAX_EVENTS}件のみ表示。絞り込みで対象を減らしてください)</span>}
        </span>
      </div>

      {visible.length === 0 ? (
        <Panel><Empty>該当する履歴はありません</Empty></Panel>
      ) : (
        <VStack gap={20}>
          {groups.map(([label, items]) => (
            <div key={label}>
              <div className="v2-label" style={{ marginBottom: 8 }}>{label}</div>
              <Panel>
                <VStack gap={0}>
                  {items.map((e, idx) => {
                    const color = CATEGORY_COLOR[e.category];
                    return (
                      <div
                        key={e.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          padding: "12px 4px",
                          borderTop: idx === 0 ? "none" : "1px solid var(--v2-border)",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            color: color.fg,
                            background: color.bg,
                            flexShrink: 0,
                          }}
                        >
                          <KindIcon kind={e.kind} />
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13 }}>{e.title}</div>
                          {e.detail && <div className="v2-mute" style={{ fontSize: 12, marginTop: 2 }}>{e.detail}</div>}
                          <div className="v2-mute" style={{ fontSize: 11, marginTop: 2 }}>{formatDateTime(e.ts)}</div>
                        </div>
                        {typeof e.amount === "number" && (
                          <div className="v2-num-cell" style={{ fontSize: 13, whiteSpace: "nowrap" }}>
                            {e.amount.toLocaleString()}円
                          </div>
                        )}
                      </div>
                    );
                  })}
                </VStack>
              </Panel>
            </div>
          ))}
        </VStack>
      )}
    </VStack>
  );
}
