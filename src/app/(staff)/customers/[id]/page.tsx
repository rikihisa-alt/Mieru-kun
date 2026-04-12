import { getCustomerById } from "@/lib/db/customers";
import { getVisitsByCustomer } from "@/lib/db/visits";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import {
  formatCurrency,
  formatDateTime,
  formatMinutes,
  rankLabel,
  rankColor,
  visitStatusLabel,
  visitStatusColor,
} from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let customer;
  let visits: Awaited<ReturnType<typeof getVisitsByCustomer>> = [];

  try {
    customer = await getCustomerById(id);
    if (customer) {
      visits = await getVisitsByCustomer(id);
    }
  } catch {
    // Supabase未接続
  }

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <Link
        href="/customers"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        顧客一覧に戻る
      </Link>

      {/* 基本情報 */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">{customer.name}</h1>
          <Badge variant="custom" className={rankColor(customer.rank)}>
            {rankLabel(customer.rank)}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <InfoRow label="電話番号" value={customer.phone || "-"} />
          <InfoRow label="メール" value={customer.email || "-"} />
          <InfoRow label="来店回数" value={`${customer.total_visits}回`} />
          <InfoRow label="累計利用額" value={formatCurrency(customer.total_spent)} />
          <InfoRow label="チップ残高" value={`${customer.chip_balance.toLocaleString()}枚`} />
          <InfoRow label="ポイント" value={`${customer.point_balance.toLocaleString()}pt`} />
        </div>
        {customer.notes && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1">メモ</p>
            <p className="text-sm">{customer.notes}</p>
          </div>
        )}
      </Card>

      {/* 来店履歴 */}
      <div>
        <h2 className="text-sm font-semibold mb-2">来店履歴</h2>
        {visits.length === 0 ? (
          <Card className="text-center py-6">
            <p className="text-sm text-muted-foreground">来店履歴はありません</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {visits.map((visit) => (
              <Card key={visit.id}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(visit.check_in_at)}
                  </span>
                  <Badge variant="custom" className={visitStatusColor(visit.status)}>
                    {visitStatusLabel(visit.status)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  {visit.table_number && (
                    <span className="text-muted-foreground">卓: {visit.table_number}</span>
                  )}
                  <span className="font-medium">{formatCurrency(visit.total_amount)}</span>
                  {visit.stay_minutes != null && (
                    <span className="text-muted-foreground">
                      {formatMinutes(visit.stay_minutes)}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
