import { getTodaySummary, getUnsettledCount } from "@/lib/db/analytics";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Users, AlertTriangle, Monitor } from "lucide-react";
import Link from "next/link";

export default async function StaffHomePage() {
  let summary = { total_sales: 0, total_visitors: 0, total_orders: 0, avg_spend: 0, date: "" };
  let unsettled = 0;
  try {
    [summary, unsettled] = await Promise.all([getTodaySummary(), getUnsettledCount()]);
  } catch { /* demo */ }

  return (
    <div className="space-y-3 max-w-md mx-auto">
      {/* 速報 */}
      <div className="grid grid-cols-2 gap-2">
        <MiniKPI icon={<DollarSign />} label="売上" value={formatCurrency(summary.total_sales)} />
        <MiniKPI icon={<Users />} label="来店" value={`${summary.total_visitors}人`} />
      </div>

      {unsettled > 0 && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-status-warning-bg border border-status-warning/20 rounded-[var(--radius)] text-[12px]">
          <AlertTriangle className="w-3.5 h-3.5 text-status-warning" />
          <span className="text-status-warning font-medium">未精算 {unsettled}件</span>
        </div>
      )}

      {/* 管理画面リンク */}
      <Link
        href="/dashboard"
        className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-bg-white border border-border rounded-[var(--radius)] text-[13px] font-medium text-accent hover:bg-accent-light transition-colors"
      >
        <Monitor className="w-4 h-4" />
        管理画面を開く
      </Link>
    </div>
  );
}

function MiniKPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-bg-white border border-border rounded-[var(--radius)] px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-text-tertiary [&>svg]:w-3 [&>svg]:h-3">{icon}</span>
        <span className="text-[10px] text-text-tertiary font-medium">{label}</span>
      </div>
      <p className="text-[18px] font-bold text-text-primary">{value}</p>
    </div>
  );
}
