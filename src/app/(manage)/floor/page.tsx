"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEMO_STORE_ID, formatTime } from "@/lib/utils";
import type { VisitWithCustomer } from "@/types/database";
import { Plus, UserCheck, Clock, CreditCard } from "lucide-react";

export default function FloorPage() {
  const [visits, setVisits] = useState<VisitWithCustomer[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => { loadVisits(); }, []);

  async function loadVisits() {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("visits")
        .select("*, customer:customers(*)")
        .eq("store_id", DEMO_STORE_ID)
        .eq("status", "active")
        .order("check_in_at", { ascending: false });
      const v = (data as VisitWithCustomer[]) ?? [];
      setVisits(v);
      setCount(v.length);
    } catch { /* demo */ }
  }

  return (
    <div className="space-y-4 max-w-4xl">
      {/* ツールバー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-text-secondary">
            現在 <strong className="text-text-primary">{count}名</strong> 来店中
          </span>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-[7px] bg-accent text-text-inverse text-[13px] font-medium rounded-[var(--radius)] hover:bg-accent-hover transition-colors">
          <Plus className="w-3.5 h-3.5" />
          入店登録
        </button>
      </div>

      {/* テーブル */}
      <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-bg">
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">顧客名</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">入店時刻</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">卓</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">滞在</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">金額</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody>
            {visits.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-text-tertiary">
                  <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>来店中の顧客はいません</p>
                </td>
              </tr>
            ) : (
              visits.map((v) => {
                const stayMin = Math.round((Date.now() - new Date(v.check_in_at).getTime()) / 60000);
                const h = Math.floor(stayMin / 60);
                const m = stayMin % 60;
                return (
                  <tr key={v.id} className="border-b border-border-light hover:bg-bg-hover transition-colors">
                    <td className="px-4 py-2.5 font-medium">{v.customer?.name ?? "—"}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{formatTime(v.check_in_at)}</td>
                    <td className="px-4 py-2.5">
                      {v.table_number ? (
                        <span className="inline-block px-2 py-0.5 bg-bg rounded text-[12px] font-medium">{v.table_number}</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary font-mono text-[12px]">
                      <Clock className="w-3 h-3 inline mr-1 opacity-50" />{h > 0 ? `${h}h` : ""}{m}m
                    </td>
                    <td className="px-4 py-2.5 font-medium">¥{v.total_amount.toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      <button className="flex items-center gap-1 px-2.5 py-1 text-[12px] text-accent hover:bg-accent-light rounded-[var(--radius)] transition-colors">
                        <CreditCard className="w-3 h-3" />精算
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
