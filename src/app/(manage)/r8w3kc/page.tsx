"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell, Coffee, Utensils, ChevronRight, Volume2, VolumeX,
  History as HistoryIcon, AlertTriangle, Check, Play, Hourglass, X, RotateCcw,
} from "lucide-react";
import { useOrders, useOrderEvents, orderStore } from "@/lib/orders/store";
import {
  type Order, type OrderStatus, type OrderKind,
  KIND_LABEL, STATUS_LABEL, CALL_REASON_LABEL, TABLE_TYPE_LABEL,
} from "@/lib/orders/types";
import { playNewOrderBeep, playCallAlert, unlockAudio } from "@/lib/orders/notify";

type FilterTab = "open" | "call" | "preparing" | "served" | "all";

const STATUS_COLORS: Record<OrderStatus, { bg: string; border: string; text: string; chip: string }> = {
  new:        { bg: "rgba(200,123,26,0.05)", border: "#c87b1a", text: "#8a5a10", chip: "bg-[#fef7e0] text-[#8a5a10] border-[#c87b1a]/40" },
  preparing:  { bg: "rgba(58,143,124,0.05)", border: "#3a8f7c", text: "#0e7a55", chip: "bg-[#e6f4ea] text-[#0e7a55] border-[#3a8f7c]/40" },
  served:     { bg: "rgba(28,46,60,0.03)",   border: "rgba(28,46,60,0.30)", text: "#4f5c67", chip: "bg-bg-hover text-text-secondary border-border" },
  done:       { bg: "rgba(28,46,60,0.02)",   border: "rgba(28,46,60,0.15)", text: "#8e9baa", chip: "bg-bg-hover text-text-tertiary border-border-light" },
  canceled:   { bg: "rgba(164,41,31,0.04)",  border: "#a4291f", text: "#a4291f", chip: "bg-[#fdeeed] text-[#a4291f] border-[#a4291f]/40" },
};

export default function StaffOrderDashboard() {
  const orders = useOrders();
  const [filter, setFilter] = useState<FilterTab>("open");
  const [soundOn, setSoundOn] = useState(true);
  const soundOnRef = useRef(soundOn);
  useEffect(() => { soundOnRef.current = soundOn; }, [soundOn]);

  // 新着リアルタイム通知(音 + フラッシュ)
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const flashTimers = useRef<Map<string, number>>(new Map());

  useOrderEvents((e) => {
    if (e.type !== "added" || !e.order) return;
    if (soundOnRef.current) {
      if (e.order.kind === "call") playCallAlert(); else playNewOrderBeep();
    }
    setFlashIds(prev => {
      const next = new Set(prev); next.add(e.order!.id); return next;
    });
    const t = window.setTimeout(() => {
      setFlashIds(prev => { const n = new Set(prev); n.delete(e.order!.id); return n; });
      flashTimers.current.delete(e.order!.id);
    }, 6000);
    flashTimers.current.set(e.order.id, t);
  });

  // KPI
  const counts = useMemo(() => ({
    open: orders.filter(o => o.status === "new").length,
    call: orders.filter(o => o.status === "new" && o.kind === "call").length,
    preparing: orders.filter(o => o.status === "preparing").length,
    served: orders.filter(o => o.status === "served").length,
  }), [orders]);

  // フィルタ
  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (filter === "open") return o.status === "new" || o.status === "preparing";
      if (filter === "call") return o.kind === "call" && (o.status === "new" || o.status === "preparing");
      if (filter === "preparing") return o.status === "preparing";
      if (filter === "served") return o.status === "served";
      return true;
    });
  }, [orders, filter]);

  // ページタイトル動的更新
  useEffect(() => {
    const orig = document.title;
    if (counts.open > 0) document.title = `(${counts.open}) 注文管理 - てんぽみえるくん`;
    return () => { document.title = orig; };
  }, [counts.open]);

  return (
    <div className="space-y-4" onClick={unlockAudio}>
      {/* ===== ヘッダー ===== */}
      <section className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-end gap-10 flex-wrap">
          <Kpi label="未対応" value={counts.open} accent={counts.call > 0} danger={counts.call > 0} blink={counts.open > 0} />
          <Kpi label="呼び出し" value={counts.call} danger />
          <Kpi label="準備中" value={counts.preparing} />
          <Kpi label="提供済(未完了)" value={counts.served} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundOn(v => !v)}
            className={`flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium border rounded-[6px] transition-colors ${
              soundOn ? "border-accent/40 text-accent bg-accent-light/50" : "border-border text-text-tertiary"
            }`}
            title="新規通知音"
          >
            {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            {soundOn ? "ON" : "OFF"}
          </button>
          <Link href="/r8w3kc/h9j4dy" className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium border border-border rounded-[6px] hover:bg-bg-hover">
            <HistoryIcon className="w-3.5 h-3.5" />履歴
          </Link>
        </div>
      </section>

      {/* ===== フィルタタブ ===== */}
      <section className="border-b border-[rgba(28,46,60,0.08)]">
        <div className="flex gap-0">
          {([
            { k: "open", label: `未対応 (${counts.open + counts.preparing})` },
            { k: "call", label: `呼び出しのみ (${counts.call})`, emphasize: counts.call > 0 },
            { k: "preparing", label: "準備中" },
            { k: "served", label: "提供済" },
            { k: "all", label: "すべて" },
          ] as { k: FilterTab; label: string; emphasize?: boolean }[]).map(t => {
            const active = filter === t.k;
            return (
              <button
                key={t.k}
                onClick={() => setFilter(t.k)}
                className={`px-4 py-2 text-[12.5px] font-medium border-b-2 transition-colors ${
                  active ? "border-text-primary text-text-primary" : "border-transparent text-text-tertiary hover:text-text-secondary"
                } ${t.emphasize ? "text-[#a4291f]" : ""}`}
              >{t.label}</button>
            );
          })}
        </div>
      </section>

      {/* ===== 注文一覧 ===== */}
      {filtered.length === 0 ? (
        <div className="border border-[rgba(28,46,60,0.08)] rounded-[8px] py-16 text-center bg-white">
          <Check className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
          <p className="text-[13px] text-text-tertiary">該当する注文はありません</p>
        </div>
      ) : (
        <div className="grid gap-2.5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(o => (
            <OrderCard
              key={o.id}
              order={o}
              flash={flashIds.has(o.id)}
              onUpdate={(s) => orderStore.updateStatus(o.id, s)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ===================
function Kpi({ label, value, accent, danger, blink }: { label: string; value: number; accent?: boolean; danger?: boolean; blink?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-[0.18em]">{label}</span>
      <span
        className={`text-[26px] font-semibold tabular-nums leading-none mt-1 tracking-tight ${blink && value > 0 ? "animate-pulse" : ""}`}
        style={{ color: danger ? "#a4291f" : accent ? "#c87b1a" : "var(--text-primary)" }}
      >{value}</span>
    </div>
  );
}

// ===================
function OrderCard({ order, flash, onUpdate }: { order: Order; flash: boolean; onUpdate: (s: OrderStatus) => void }) {
  const color = STATUS_COLORS[order.status];
  const isCall = order.kind === "call";
  const isUnattended = order.status === "new";

  return (
    <div
      className={`relative bg-white border rounded-[8px] overflow-hidden transition-all ${
        flash ? "ring-2 ring-[#c87b1a] ring-offset-1" : ""
      }`}
      style={{
        borderColor: isCall && isUnattended ? "#a4291f" : color.border,
        borderWidth: isCall && isUnattended ? 2 : 1,
        background: order.status === "done" ? "#fafafa" : "white",
      }}
    >
      {/* 左サイドバー: ステータスカラー */}
      <span className="absolute top-0 bottom-0 left-0 w-1" style={{ background: isCall && isUnattended ? "#a4291f" : color.border }} />

      {/* 呼び出しは点滅 */}
      {isCall && isUnattended && (
        <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#a4291f] text-white text-[10px] font-bold animate-pulse">
          <Bell className="w-3 h-3" />呼び出し
        </span>
      )}

      <div className="pl-4 pr-3 py-3">
        {/* 上段: 卓席 + 時刻 */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="text-[10px] text-text-tertiary leading-none">{TABLE_TYPE_LABEL[order.seat.tableType]}</p>
            <p className="text-[16px] font-bold leading-tight">
              {order.seat.tableNo} <span className="text-[12px] text-text-tertiary ml-0.5">{order.seat.seatNo}番</span>
            </p>
            <p className="text-[10px] text-text-tertiary mt-0.5">{order.customer.displayName}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-text-tertiary leading-none">{formatTime(order.createdAt)}</p>
            <p className="text-[10px] text-text-tertiary mt-0.5">{elapsed(order.createdAt)}</p>
          </div>
        </div>

        {/* 中段: 種別 + ステータス */}
        <div className="flex items-center gap-1.5 mb-2">
          <KindBadge kind={order.kind} />
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${color.chip}`}>{STATUS_LABEL[order.status]}</span>
        </div>

        {/* 下段: 内容 */}
        {order.kind === "call" && order.call && (
          <div className="bg-[#fef7e0] border border-[#c87b1a]/30 rounded-[6px] px-3 py-2 mb-2">
            <p className="text-[13px] font-semibold text-[#8a5a10] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />{CALL_REASON_LABEL[order.call.type]}
            </p>
            {order.call.text && <p className="text-[11px] text-[#8a5a10] mt-1">{order.call.text}</p>}
          </div>
        )}
        {order.items && order.items.length > 0 && (
          <div className="space-y-1 mb-2">
            {order.items.map((it, i) => (
              <div key={i} className="text-[12.5px]">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="font-medium">
                    {it.category === "premium" && <span className="text-[9px] text-[#c87b1a] mr-1">プレ</span>}
                    {it.name}
                  </span>
                  <span className="text-text-tertiary tabular-nums whitespace-nowrap">× {it.qty}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {Object.entries(it.options).filter(([, v]) => v !== false && v !== "").map(([k, v]) => (
                    <span key={k} className="px-1.5 py-px bg-bg-hover rounded text-[9.5px] text-text-secondary">
                      {typeof v === "boolean" ? optionLabel(k) : String(v)}
                    </span>
                  ))}
                </div>
                {it.note && <p className="text-[10.5px] text-text-tertiary mt-0.5">📝 {it.note}</p>}
              </div>
            ))}
          </div>
        )}

        {/* アクション */}
        <div className="flex gap-1 pt-2 border-t border-[rgba(28,46,60,0.06)]">
          {order.status === "new" && (
            <>
              <ActionBtn onClick={() => onUpdate("preparing")} primary icon={<Play className="w-3 h-3" />}>
                {order.kind === "call" ? "対応中" : "準備開始"}
              </ActionBtn>
              {order.kind !== "call" && (
                <ActionBtn onClick={() => onUpdate("served")} icon={<Check className="w-3 h-3" />}>提供済</ActionBtn>
              )}
              <ActionBtn onClick={() => onUpdate("canceled")} danger icon={<X className="w-3 h-3" />}>キャンセル</ActionBtn>
            </>
          )}
          {order.status === "preparing" && (
            <>
              <ActionBtn onClick={() => onUpdate("served")} primary icon={<Check className="w-3 h-3" />}>
                {order.kind === "call" ? "対応完了" : "提供完了"}
              </ActionBtn>
              <ActionBtn onClick={() => onUpdate("new")} icon={<RotateCcw className="w-3 h-3" />}>戻す</ActionBtn>
              <ActionBtn onClick={() => onUpdate("canceled")} danger icon={<X className="w-3 h-3" />}>キャンセル</ActionBtn>
            </>
          )}
          {order.status === "served" && (
            <>
              <ActionBtn onClick={() => onUpdate("done")} primary icon={<Check className="w-3 h-3" />}>完了</ActionBtn>
              <ActionBtn onClick={() => onUpdate("preparing")} icon={<RotateCcw className="w-3 h-3" />}>戻す</ActionBtn>
            </>
          )}
          {order.status === "done" && (
            <ActionBtn onClick={() => onUpdate("served")} icon={<RotateCcw className="w-3 h-3" />}>戻す</ActionBtn>
          )}
          {order.status === "canceled" && (
            <ActionBtn onClick={() => onUpdate("new")} icon={<RotateCcw className="w-3 h-3" />}>復活</ActionBtn>
          )}
        </div>
      </div>
    </div>
  );
}

function KindBadge({ kind }: { kind: OrderKind }) {
  const conf = {
    drink: { icon: <Coffee className="w-3 h-3" />, label: KIND_LABEL.drink, cls: "bg-[#e6f4ea] text-[#0e7a55] border-[#3a8f7c]/30" },
    food: { icon: <Utensils className="w-3 h-3" />, label: KIND_LABEL.food, cls: "bg-[#fef7e0] text-[#8a5a10] border-[#c87b1a]/30" },
    call: { icon: <Bell className="w-3 h-3" />, label: KIND_LABEL.call, cls: "bg-[#fdeeed] text-[#a4291f] border-[#a4291f]/30" },
  }[kind];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-semibold ${conf.cls}`}>
      {conf.icon}{conf.label}
    </span>
  );
}

function ActionBtn({ onClick, children, primary, danger, icon }: {
  onClick: () => void; children: React.ReactNode; primary?: boolean; danger?: boolean; icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1.5 text-[11.5px] font-medium rounded-[5px] transition-colors ${
        primary
          ? "bg-text-primary text-white hover:opacity-90"
          : danger
            ? "text-[#a4291f] hover:bg-[#fdeeed]"
            : "border border-border text-text-secondary hover:bg-bg-hover"
      }`}
    >
      {icon}{children}
    </button>
  );
}

function optionLabel(k: string) {
  return { sauceSeparate: "ソース別添え" }[k] ?? k;
}
function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function elapsed(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "たった今";
  if (diff < 60) return `${diff}分前`;
  return `${Math.floor(diff / 60)}時間前`;
}

// 未使用警告回避
void Hourglass; void ChevronRight;
