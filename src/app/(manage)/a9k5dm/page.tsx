"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Plus } from "lucide-react";
import { CustomerActionMenu } from "@/components/shared/customer-action-menu";

type Rank = "regular" | "silver" | "gold" | "vip";

interface Customer {
  id: string; name: string; nickname: string; rank: Rank; phone: string;
  totalVisits: number; totalSpent: number; chipBalance: number; pointBalance: number; lastVisit: string;
}

const DEMO: Customer[] = [
  { id: "a8f3d9c2", name: "田中 太郎", nickname: "タロウ", rank: "gold", phone: "090-1234-5678", totalVisits: 25, totalSpent: 150000, chipBalance: 5000, pointBalance: 1200, lastVisit: "2026/04/10" },
  { id: "b4c9d2f1", name: "鈴木 花子", nickname: "ハナ", rank: "vip", phone: "090-2345-6789", totalVisits: 50, totalSpent: 350000, chipBalance: 12000, pointBalance: 3500, lastVisit: "2026/04/12" },
  { id: "c2e5a9f3", name: "佐藤 健一", nickname: "ケン", rank: "silver", phone: "090-3456-7890", totalVisits: 10, totalSpent: 45000, chipBalance: 2000, pointBalance: 400, lastVisit: "2026/04/08" },
  { id: "d1b7f4c8", name: "高橋 美咲", nickname: "ミィ", rank: "regular", phone: "", totalVisits: 3, totalSpent: 12000, chipBalance: 500, pointBalance: 100, lastVisit: "2026/04/05" },
  { id: "e9a3b2d5", name: "伊藤 大輔", nickname: "ダイ", rank: "regular", phone: "090-4567-8901", totalVisits: 1, totalSpent: 3000, chipBalance: 0, pointBalance: 50, lastVisit: "2026/04/01" },
  { id: "f8d2e4a7", name: "渡辺 優子", nickname: "ユウ", rank: "gold", phone: "090-5678-9012", totalVisits: 30, totalSpent: 200000, chipBalance: 8000, pointBalance: 2000, lastVisit: "2026/04/11" },
  { id: "7c3f9a2d", name: "山本 翔太", nickname: "ショウ", rank: "silver", phone: "", totalVisits: 8, totalSpent: 32000, chipBalance: 1500, pointBalance: 300, lastVisit: "2026/03/28" },
  { id: "8b5d4e7f", name: "中村 あゆみ", nickname: "アユ", rank: "regular", phone: "090-6789-0123", totalVisits: 2, totalSpent: 8000, chipBalance: 200, pointBalance: 80, lastVisit: "2026/03/20" },
];

const RANK_TEXT: Record<Rank, string> = {
  regular: "text-text-tertiary",
  silver: "text-[#475569]",
  gold: "text-status-warning",
  vip: "text-[#7c3aed]",
};
const RANK_LABEL: Record<Rank, string> = { regular: "Regular", silver: "SILVER", gold: "GOLD", vip: "VIP" };

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [menu, setMenu] = useState<{ customer: Customer; x: number; y: number } | null>(null);

  const filtered = search
    ? DEMO.filter(c => c.name.includes(search) || c.nickname.includes(search) || c.phone.includes(search))
    : DEMO;

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
            <KpiItem label="登録顧客" value={DEMO.length} unit="名" />
            <KpiItem label="VIP/GOLD" value={DEMO.filter(c => c.rank === "vip" || c.rank === "gold").length} unit="名" />
            <KpiItem label="今月来店" value={DEMO.filter(c => c.lastVisit >= "2026/04").length} unit="名" />
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
              <th>最終来店</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="!py-12 text-center text-text-tertiary">
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
                <td className="text-text-secondary">{c.lastVisit}</td>
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
