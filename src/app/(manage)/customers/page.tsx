import Link from "next/link";
import { getCustomers } from "@/lib/db/customers";
import { getAuthContext } from "@/lib/auth";
import { DEMO_STORE_ID, formatCurrency, formatDate, rankLabel } from "@/lib/utils";
import { Users, Search } from "lucide-react";
import type { Customer } from "@/types/database";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  const ctx = await getAuthContext();
  const storeId = ctx?.storeId ?? DEMO_STORE_ID;

  let customers: Customer[] = [];
  try {
    customers = await getCustomers(q || undefined);
  } catch {
    /* demo */
  }

  function rankBadgeClass(rank: string): string {
    switch (rank) {
      case "gold":
        return "bg-status-warning-bg text-status-warning";
      case "vip":
        return "bg-[#f3e8fd] text-[#7c3aed]";
      default:
        return "bg-bg text-text-secondary";
    }
  }

  return (
    <div className="space-y-4">
      {/* 検索 */}
      <form className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="顧客名・電話番号で検索"
            className="pl-9 pr-3 py-[7px] text-[13px]"
          />
        </div>
        <button
          type="submit"
          className="px-3 py-[7px] bg-accent text-text-inverse text-[13px] font-medium rounded-[var(--radius)] hover:bg-accent-hover transition-colors"
        >
          検索
        </button>
      </form>

      {/* テーブル */}
      <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-bg">
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">顧客名</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">ランク</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">来店数</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">累計利用額</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">チップ残高</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">ポイント</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">最終来店</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-text-tertiary">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>顧客データがありません</p>
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="border-b border-border-light hover:bg-bg-hover transition-colors">
                  <td className="px-4 py-2.5">
                    <Link href={`/customers/${c.id}`} className="font-medium text-accent hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline px-2 py-0.5 text-[11px] font-medium rounded-[var(--radius-sm)] ${rankBadgeClass(c.rank)}`}>
                      {rankLabel(c.rank)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{c.total_visits}回</td>
                  <td className="px-4 py-2.5 font-medium">{formatCurrency(c.total_spent)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{c.chip_balance.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{c.point_balance.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-text-secondary text-[12px]">
                    {c.last_visit_at ? formatDate(c.last_visit_at) : "—"}
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
