import { getTodaySummary, getUnsettledCount } from "@/lib/db/analytics";
import { StatCard } from "@/components/ui/card";
import { Card } from "@/components/ui/card";
import {
  DollarSign,
  Users,
  ShoppingCart,
  AlertCircle,
  Monitor,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default async function StaffHomePage() {
  let summary = { total_sales: 0, total_visitors: 0, total_orders: 0, avg_spend: 0, date: "" };
  let unsettledCount = 0;

  try {
    [summary, unsettledCount] = await Promise.all([
      getTodaySummary(),
      getUnsettledCount(),
    ]);
  } catch {
    // Supabase未接続時はデフォルト値を使用
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">スタッフホーム</h1>
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Monitor className="w-3.5 h-3.5" />
          管理画面
        </Link>
      </div>

      {/* 売上速報 */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title="本日の売上"
          value={formatCurrency(summary.total_sales)}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatCard
          title="来店数"
          value={`${summary.total_visitors}人`}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="注文数"
          value={`${summary.total_orders}件`}
          icon={<ShoppingCart className="w-5 h-5" />}
        />
        <StatCard
          title="未精算"
          value={`${unsettledCount}件`}
          icon={<AlertCircle className="w-5 h-5" />}
        />
      </div>

      {/* クイックアクション */}
      <Card>
        <h2 className="text-sm font-semibold mb-3">クイックアクション</h2>
        <div className="grid grid-cols-2 gap-2">
          <QuickAction href="/checkin" label="入店登録" color="bg-primary" />
          <QuickAction href="/checkout" label="退店/精算" color="bg-success" />
          <QuickAction href="/orders" label="注文登録" color="bg-warning" />
          <QuickAction href="/customers/new" label="顧客登録" color="bg-info" />
        </div>
      </Card>

      {/* 客単価 */}
      <Card>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">客単価</span>
          <span className="text-lg font-bold">{formatCurrency(summary.avg_spend)}</span>
        </div>
      </Card>
    </div>
  );
}

function QuickAction({ href, label, color }: { href: string; label: string; color: string }) {
  return (
    <Link
      href={href}
      className={`${color} text-white text-center py-3 rounded-lg text-sm font-medium active:opacity-80 transition-opacity`}
    >
      {label}
    </Link>
  );
}
