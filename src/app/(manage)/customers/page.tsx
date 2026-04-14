"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Plus, Users } from "lucide-react";

type Rank = "regular" | "silver" | "gold" | "vip";

interface Customer {
  id: string; name: string; rank: Rank; phone: string;
  totalVisits: number; totalSpent: number; chipBalance: number; pointBalance: number; lastVisit: string;
}

const DEMO: Customer[] = [
  { id: "c1", name: "田中 太郎", rank: "gold", phone: "090-1234-5678", totalVisits: 25, totalSpent: 150000, chipBalance: 5000, pointBalance: 1200, lastVisit: "2026/04/10" },
  { id: "c2", name: "鈴木 花子", rank: "vip", phone: "090-2345-6789", totalVisits: 50, totalSpent: 350000, chipBalance: 12000, pointBalance: 3500, lastVisit: "2026/04/12" },
  { id: "c3", name: "佐藤 健一", rank: "silver", phone: "090-3456-7890", totalVisits: 10, totalSpent: 45000, chipBalance: 2000, pointBalance: 400, lastVisit: "2026/04/08" },
  { id: "c4", name: "高橋 美咲", rank: "regular", phone: "", totalVisits: 3, totalSpent: 12000, chipBalance: 500, pointBalance: 100, lastVisit: "2026/04/05" },
  { id: "c5", name: "伊藤 大輔", rank: "regular", phone: "090-4567-8901", totalVisits: 1, totalSpent: 3000, chipBalance: 0, pointBalance: 50, lastVisit: "2026/04/01" },
  { id: "c6", name: "渡辺 優子", rank: "gold", phone: "090-5678-9012", totalVisits: 30, totalSpent: 200000, chipBalance: 8000, pointBalance: 2000, lastVisit: "2026/04/11" },
  { id: "c7", name: "山本 翔太", rank: "silver", phone: "", totalVisits: 8, totalSpent: 32000, chipBalance: 1500, pointBalance: 300, lastVisit: "2026/03/28" },
  { id: "c8", name: "中村 あゆみ", rank: "regular", phone: "090-6789-0123", totalVisits: 2, totalSpent: 8000, chipBalance: 200, pointBalance: 80, lastVisit: "2026/03/20" },
];

const RANK_BADGE: Record<Rank, string> = {
  regular: "bg-[#faf8f5] text-[#5a6977]",
  silver: "bg-[#faf8f5] text-[#5a6977]",
  gold: "bg-[#fef7e0] text-[#d97706]",
  vip: "bg-[#f3e8fd] text-[#7c3aed]",
};
const RANK_LABEL: Record<Rank, string> = { regular: "レギュラー", silver: "シルバー", gold: "ゴールド", vip: "VIP" };

export default function CustomersPage() {
  const [search, setSearch] = useState("");

  const filtered = search
    ? DEMO.filter(c => c.name.includes(search) || c.phone.includes(search))
    : DEMO;

  return (
    <div className="space-y-4">
      {/* ツールバー */}
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e9baa] pointer-events-none" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="顧客名・電話番号で検索" className="w-full pl-10 pr-3 py-[7px] text-[13px] border border-[#d8d3cc] rounded-[6px] focus:outline-none focus:border-[#3a8f7c]" />
        </div>
        <Link href="/customers/new"
          className="flex items-center gap-1 px-3 py-[7px] bg-[#3a8f7c] text-white text-[13px] font-medium rounded-[6px] hover:bg-[#2f7a69] transition-colors">
          <Plus className="w-3.5 h-3.5" />顧客登録
        </Link>
      </div>

      {/* テーブル */}
      <div className="overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#e8e4df]">
              <th className="px-4 py-2.5 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">顧客名</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">ランク</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">来店</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">累計利用額</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">チップ</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">ポイント</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">最終来店</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[#8e9baa]">
                <Image src="/logo-icon.png" alt="みえるくん" width={32} height={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-[13px]">該当する顧客がいません</p>
              </td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="border-b border-[#f3f0ec] hover:bg-[#faf8f5] transition-colors cursor-pointer" onClick={() => window.location.href = `/customers/${c.id}`}>
                <td className="px-4 py-2.5">
                  <Link href={`/customers/${c.id}`} className="font-medium text-[#3a8f7c] hover:underline">{c.name}</Link>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-[4px] ${RANK_BADGE[c.rank]}`}>{RANK_LABEL[c.rank]}</span>
                </td>
                <td className="px-4 py-2.5 text-[#5a6977]">{c.totalVisits}回</td>
                <td className="px-4 py-2.5 font-medium">¥{c.totalSpent.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-[#5a6977]">{c.chipBalance.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-[#5a6977]">{c.pointBalance.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-[#5a6977] text-[12px]">{c.lastVisit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
