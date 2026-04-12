import { getTodaySummary, getDailySales, getUnsettledCount } from "@/lib/db/analytics";
import { StatCard } from "@/components/ui/card";
import { Card } from "@/components/ui/card";
import {
  DollarSign,
  Users,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DashboardChart } from "./chart";

export default async function DashboardPage() {
  let summary = { total_sales: 0, total_visitors: 0, total_orders: 0, avg_spend: 0, date: "" };
  let dailySales: Awaited<ReturnType<typeof getDailySales>> = [];
  let unsettled = 0;

  try {
    [summary, dailySales, unsettled] = await Promise.all([
      getTodaySummary(),
      getDailySales(14),
      getUnsettledCount(),
    ]);
  } catch {
    // Supabase未接続時
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <span className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "short",
          })}
        </span>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="本日の売上"
          value={formatCurrency(summary.total_sales)}
          icon={<DollarSign className="w-6 h-6" />}
        />
        <StatCard
          title="来店数"
          value={`${summary.total_visitors}人`}
          subtitle={`未精算: ${unsettled}件`}
          icon={<Users className="w-6 h-6" />}
        />
        <StatCard
          title="注文数"
          value={`${summary.total_orders}件`}
          icon={<ShoppingCart className="w-6 h-6" />}
        />
        <StatCard
          title="客単価"
          value={formatCurrency(summary.avg_spend)}
          icon={<TrendingUp className="w-6 h-6" />}
        />
      </div>

      {/* 売上推移グラフ */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">売上推移（過去14日）</h2>
        <DashboardChart data={dailySales} />
      </Card>
    </div>
  );
}
