"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEMO_STORE_ID, formatCurrency, formatTime } from "@/lib/utils";
import type { VisitWithCustomer } from "@/types/database";
import { ShoppingBag, CreditCard, ClipboardList } from "lucide-react";

type FilterTab = "all" | "active" | "settled";

export default function OrdersPage() {
  const [visits, setVisits] = useState<VisitWithCustomer[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");

  useEffect(() => {
    loadVisits();
  }, []);

  async function loadVisits() {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("visits")
        .select("*, customer:customers(*)")
        .eq("store_id", DEMO_STORE_ID)
        .in("status", ["active", "settled"])
        .order("check_in_at", { ascending: false });
      setVisits((data as VisitWithCustomer[]) ?? []);
    } catch {
      /* demo */
    }
  }

  const filtered = visits.filter((v) => {
    if (filter === "all") return true;
    return v.status === filter;
  });

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "すべて" },
    { key: "active", label: "未精算" },
    { key: "settled", label: "精算済" },
  ];

  return (
    <div className="space-y-4 max-w-5xl">
      {/* フィルタタブ */}
      <div className="flex items-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-[7px] text-[13px] font-medium rounded-[var(--radius)] transition-colors ${
              filter === tab.key
                ? "bg-accent-light text-accent"
                : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* テーブル */}
      <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-bg">
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">顧客名</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">卓</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">注文数</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">金額</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">ステータス</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-text-tertiary">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>該当する来店データはありません</p>
                </td>
              </tr>
            ) : (
              filtered.map((v) => (
                <tr key={v.id} className="border-b border-border-light hover:bg-bg-hover transition-colors">
                  <td className="px-4 py-2.5 font-medium">{v.customer?.name ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    {v.table_number ? (
                      <span className="inline-block px-2 py-0.5 bg-bg rounded text-[12px] font-medium">{v.table_number}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">—</td>
                  <td className="px-4 py-2.5 font-medium">{formatCurrency(v.total_amount)}</td>
                  <td className="px-4 py-2.5">
                    {v.status === "active" ? (
                      <span className="inline px-2 py-0.5 text-[11px] font-medium rounded-[var(--radius-sm)] bg-status-success-bg text-status-success">
                        来店中
                      </span>
                    ) : (
                      <span className="inline px-2 py-0.5 text-[11px] font-medium rounded-[var(--radius-sm)] bg-[#e8f0fe] text-accent">
                        精算済
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {v.status === "active" ? (
                      <div className="flex items-center gap-1">
                        <button className="flex items-center gap-1 px-2.5 py-1 text-[12px] text-accent hover:bg-accent-light rounded-[var(--radius)] transition-colors">
                          <ShoppingBag className="w-3 h-3" />注文
                        </button>
                        <button className="flex items-center gap-1 px-2.5 py-1 text-[12px] text-accent hover:bg-accent-light rounded-[var(--radius)] transition-colors">
                          <CreditCard className="w-3 h-3" />精算
                        </button>
                      </div>
                    ) : (
                      <span className="text-[12px] text-text-tertiary">
                        {v.check_out_at ? formatTime(v.check_out_at) : "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
