"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Search, FileDown } from "lucide-react";
import { useOrders } from "@/lib/orders/store";
import {
  KIND_LABEL, STATUS_LABEL, TABLE_TYPE_LABEL, CALL_REASON_LABEL,
  type OrderKind, type TableType,
} from "@/lib/orders/types";

export default function OrderHistoryPage() {
  const orders = useOrders();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | OrderKind>("all");
  const [tableFilter, setTableFilter] = useState<"all" | TableType>("all");

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (kindFilter !== "all" && o.kind !== kindFilter) return false;
      if (tableFilter !== "all" && o.seat.tableType !== tableFilter) return false;
      if (dateFilter && !o.createdAt.startsWith(dateFilter)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = [
          o.seat.tableNo, o.customer.displayName,
          ...(o.items?.map(i => i.name) ?? []),
          o.call ? CALL_REASON_LABEL[o.call.type] : "",
        ].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, kindFilter, tableFilter, dateFilter, search]);

  function exportCSV() {
    const header = "日時,卓,席,顧客,種別,商品/理由,ステータス";
    const rows = filtered.map(o => {
      const content = o.kind === "call"
        ? (o.call ? CALL_REASON_LABEL[o.call.type] + (o.call.text ? `(${o.call.text})` : "") : "")
        : (o.items?.map(i => `${i.name}×${i.qty}`).join(" / ") ?? "");
      return [o.createdAt, o.seat.tableNo, o.seat.seatNo, o.customer.displayName, KIND_LABEL[o.kind], content, STATUS_LABEL[o.status]].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });
    const csv = "﻿" + [header, ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "order_history.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <Link href="/r8w3kc" className="inline-flex items-center gap-1 text-[13px] text-text-secondary hover:text-text-primary">
        <ArrowLeft className="w-3.5 h-3.5" />ライブ管理画面
      </Link>

      <div>
        <h1 className="text-[18px] font-bold text-text-primary mb-1">注文履歴</h1>
        <p className="text-[12px] text-text-tertiary">{filtered.length}件 / 全{orders.length}件</p>
      </div>

      {/* フィルタ */}
      <div className="flex items-center gap-2 flex-wrap p-3 border border-[rgba(28,46,60,0.08)] rounded-[8px] bg-white">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="商品/顧客/卓で検索"
            style={{ paddingLeft: 36 }}
            className="text-[13px]"
          />
        </div>
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="text-[13px] max-w-[160px]" />
        <select value={kindFilter} onChange={e => setKindFilter(e.target.value as "all" | OrderKind)} className="text-[13px] max-w-[140px]">
          <option value="all">種別: すべて</option>
          <option value="drink">ドリンク</option>
          <option value="food">フード</option>
          <option value="call">呼び出し</option>
        </select>
        <select value={tableFilter} onChange={e => setTableFilter(e.target.value as "all" | TableType)} className="text-[13px] max-w-[140px]">
          <option value="all">卓: すべて</option>
          {(Object.keys(TABLE_TYPE_LABEL) as TableType[]).map(t => <option key={t} value={t}>{TABLE_TYPE_LABEL[t]}</option>)}
        </select>
        <button onClick={exportCSV} className="px-3 py-1.5 text-[12px] font-medium border border-border rounded-[6px] hover:bg-bg-hover flex items-center gap-1">
          <FileDown className="w-3 h-3" />CSV
        </button>
      </div>

      {/* 履歴テーブル */}
      <div className="border border-[rgba(28,46,60,0.08)] rounded-[8px] overflow-hidden bg-white">
        <div className="grid grid-cols-[110px_100px_60px_100px_80px_1fr_90px] items-center px-3 py-2 border-b border-[rgba(28,46,60,0.08)] bg-[#fafafa] text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
          <span>日時</span>
          <span>卓</span>
          <span>席</span>
          <span>顧客</span>
          <span>種別</span>
          <span>内容</span>
          <span>状態</span>
        </div>
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-[12px] text-text-tertiary">該当する履歴がありません</p>
        ) : filtered.map(o => {
          const content = o.kind === "call"
            ? (o.call ? CALL_REASON_LABEL[o.call.type] + (o.call.text ? ` (${o.call.text})` : "") : "")
            : (o.items?.map(i => `${i.name}×${i.qty}`).join(" / ") ?? "");
          return (
            <div key={o.id} className="grid grid-cols-[110px_100px_60px_100px_80px_1fr_90px] items-center px-3 py-2 border-b border-[rgba(28,46,60,0.04)] last:border-0 hover:bg-[#fafafa] text-[12.5px]">
              <span className="text-text-secondary tabular-nums">{formatDateTime(o.createdAt)}</span>
              <span className="font-medium">{o.seat.tableNo}</span>
              <span className="tabular-nums">{o.seat.seatNo}</span>
              <span className="text-text-secondary truncate">{o.customer.displayName}</span>
              <span className="text-text-secondary">{KIND_LABEL[o.kind]}</span>
              <span className="truncate">{content}</span>
              <span className="text-[10px]">
                <span className={`px-1.5 py-0.5 rounded border ${
                  o.status === "new" ? "bg-[#fef7e0] text-[#8a5a10] border-[#c87b1a]/40"
                  : o.status === "preparing" ? "bg-[#e6f4ea] text-[#0e7a55] border-[#3a8f7c]/40"
                  : o.status === "served" ? "bg-bg-hover text-text-secondary border-border"
                  : o.status === "done" ? "bg-bg-hover text-text-tertiary border-border-light"
                  : "bg-[#fdeeed] text-[#a4291f] border-[#a4291f]/40"
                }`}>{STATUS_LABEL[o.status]}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
