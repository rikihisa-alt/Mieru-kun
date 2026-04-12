import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerById } from "@/lib/db/customers";
import { getVisitsByCustomer } from "@/lib/db/visits";
import { getAuthContext } from "@/lib/auth";
import { DEMO_STORE_ID, formatCurrency, formatDate, formatTime, formatMinutes, rankLabel, visitStatusLabel } from "@/lib/utils";
import { ArrowLeft, Phone, Mail, Trophy, DollarSign, Coins, Star } from "lucide-react";
import type { Customer, Visit } from "@/types/database";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getAuthContext();
  const storeId = ctx?.storeId ?? DEMO_STORE_ID;

  let customer: Customer | null = null;
  let visits: Visit[] = [];

  try {
    customer = await getCustomerById(id);
    if (customer) {
      visits = await getVisitsByCustomer(id);
    }
  } catch {
    /* demo */
  }

  if (!customer) {
    notFound();
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

  function statusBadgeClass(status: string): string {
    switch (status) {
      case "active":
        return "bg-status-success-bg text-status-success";
      case "settled":
        return "bg-[#e8f0fe] text-accent";
      default:
        return "bg-bg text-text-secondary";
    }
  }

  const stats = [
    { icon: <Trophy className="w-4 h-4" />, label: "来店回数", value: `${customer.total_visits}回` },
    { icon: <DollarSign className="w-4 h-4" />, label: "累計利用額", value: formatCurrency(customer.total_spent) },
    { icon: <Coins className="w-4 h-4" />, label: "チップ残高", value: customer.chip_balance.toLocaleString() },
    { icon: <Star className="w-4 h-4" />, label: "ポイント残高", value: customer.point_balance.toLocaleString() },
  ];

  return (
    <div className="space-y-4 max-w-4xl">
      {/* 戻るリンク */}
      <Link href="/customers" className="inline-flex items-center gap-1 text-[13px] text-text-secondary hover:text-text-primary transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        顧客一覧
      </Link>

      {/* 顧客情報カード */}
      <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-[18px] font-bold text-text-primary">{customer.name}</h1>
              <span className={`inline px-2 py-0.5 text-[11px] font-medium rounded-[var(--radius-sm)] ${rankBadgeClass(customer.rank)}`}>
                {rankLabel(customer.rank)}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-[13px] text-text-secondary">
              {customer.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-text-tertiary" />
                  {customer.phone}
                </span>
              )}
              {customer.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-text-tertiary" />
                  {customer.email}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 統計行 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-bg-white border border-border rounded-[var(--radius-lg)] px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-text-tertiary">{s.icon}</span>
              <span className="text-[11px] text-text-tertiary font-medium">{s.label}</span>
            </div>
            <p className="text-[18px] font-bold text-text-primary tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

      {/* 来店履歴 */}
      <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] overflow-hidden">
        <div className="px-4 py-3 border-b border-border-light">
          <h2 className="text-[13px] font-semibold text-text-primary">来店履歴</h2>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-bg">
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">日時</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">卓</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">金額</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">滞在時間</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">ステータス</th>
            </tr>
          </thead>
          <tbody>
            {visits.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-tertiary text-[13px]">
                  来店履歴はありません
                </td>
              </tr>
            ) : (
              visits.map((v) => (
                <tr key={v.id} className="border-b border-border-light hover:bg-bg-hover transition-colors">
                  <td className="px-4 py-2.5 text-text-secondary">
                    {formatDate(v.check_in_at)} {formatTime(v.check_in_at)}
                  </td>
                  <td className="px-4 py-2.5">
                    {v.table_number ? (
                      <span className="inline-block px-2 py-0.5 bg-bg rounded text-[12px] font-medium">{v.table_number}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-medium">{formatCurrency(v.total_amount)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {v.stay_minutes != null ? formatMinutes(v.stay_minutes) : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline px-2 py-0.5 text-[11px] font-medium rounded-[var(--radius-sm)] ${statusBadgeClass(v.status)}`}>
                      {visitStatusLabel(v.status)}
                    </span>
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
