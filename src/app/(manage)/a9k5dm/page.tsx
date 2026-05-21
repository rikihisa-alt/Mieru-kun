"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Plus, Gift } from "lucide-react";
import { CustomerActionMenu } from "@/components/shared/customer-action-menu";
import { usePersisted } from "@/lib/persist/store";
import { customerStore, type CustomerRecord, type CustomerRank } from "@/lib/store/domain-stores";

type Rank = CustomerRank;
type Customer = CustomerRecord;

const RANK_TEXT: Record<Rank, string> = {
  regular: "text-text-tertiary",
  silver: "text-[#475569]",
  gold: "text-status-warning",
  vip: "text-[#7c3aed]",
};
const RANK_LABEL: Record<Rank, string> = { regular: "Regular", silver: "SILVER", gold: "GOLD", vip: "VIP" };

// ひらがな⇔カタカナを吸収するための正規化
function normalizeJa(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

export default function CustomersPage() {
  const [customers] = usePersisted(customerStore);
  const [search, setSearch] = useState("");
  const [menu, setMenu] = useState<{ customer: Customer; x: number; y: number } | null>(null);

  const q = normalizeJa(search.trim());
  const filtered = q
    ? customers.filter(c =>
        normalizeJa(c.name).includes(q) ||
        normalizeJa(c.nickname).includes(q) ||
        c.phone.includes(search)
      )
    : customers;

  function openMenu(c: Customer, e: React.MouseEvent) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenu({ customer: c, x: rect.left + rect.width / 2, y: rect.top });
  }

  return (
    <div className="page-stack">
      {/* ヘッダーストリップ: 顧客統計 + アクション */}
      <section>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="flex items-end gap-8 flex-wrap">
            <KpiItem label="登録顧客" value={customers.length} unit="名" />
            <KpiItem label="VIP/GOLD" value={customers.filter(c => c.rank === "vip" || c.rank === "gold").length} unit="名" />
            <KpiItem label="今月来店" value={customers.filter(c => (c.lastVisit ?? "") >= "2026/04").length} unit="名" />
          </div>
          <Link href="/a9k5dm/q7t3wc" className="btn btn-primary">
            <Plus className="w-3.5 h-3.5" />顧客登録
          </Link>
        </div>
      </section>

      {/* 検索 + 一覧 */}
      <section className="glass-panel">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none z-10" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ニックネーム・本名・電話番号で検索"
              style={{ paddingLeft: "40px" }}
            />
          </div>
          <span className="ml-auto t-xs text-text-tertiary">{filtered.length}件</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>ニックネーム / 本名</th>
              <th>ランク</th>
              <th>来店</th>
              <th>累計利用額</th>
              <th>チップ</th>
              <th>ポイント</th>
              <th>プライズ</th>
              <th>最終来店</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="!py-12 text-center text-text-tertiary">
                <Image src="/logo-icon.png" alt="みえるくん" width={32} height={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-[14px]">該当する顧客がいません</p>
              </td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="cursor-pointer" onClick={(e) => openMenu(c, e)}>
                <td>
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-[color:var(--primary-text)]">{c.nickname || c.name}</span>
                    {c.nickname && <span className="text-[12px] text-text-tertiary">{c.name}</span>}
                  </div>
                </td>
                <td>
                  <span className={`text-[12px] font-semibold tracking-wider ${RANK_TEXT[c.rank]}`}>{RANK_LABEL[c.rank]}</span>
                </td>
                <td className="text-text-secondary">{c.totalVisits}回</td>
                <td className="font-medium">¥{c.totalSpent.toLocaleString()}</td>
                <td className="text-text-secondary">{c.chipBalance.toLocaleString()}</td>
                <td className="text-text-secondary">{c.pointBalance.toLocaleString()}</td>
                <td>
                  {c.prizeCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[12px] text-[#b8337e]" title={c.lastPrize ? `最終付与 ${c.lastPrize}` : undefined}>
                      <Gift className="w-3 h-3" />
                      {c.prizeCount}回
                    </span>
                  ) : (
                    <span className="text-text-tertiary">—</span>
                  )}
                </td>
                <td className="text-text-secondary">{c.lastVisit ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {menu && (
        <CustomerActionMenu
          customer={{
            id: menu.customer.id,
            name: menu.customer.nickname || menu.customer.name,
            realName: menu.customer.nickname ? menu.customer.name : undefined,
            rank: menu.customer.rank,
            chips: menu.customer.chipBalance,
          }}
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}

function KpiItem({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="t-label">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className="t-value">{value}</span>
        {unit && <span className="text-[14px] text-text-tertiary">{unit}</span>}
      </span>
    </div>
  );
}
