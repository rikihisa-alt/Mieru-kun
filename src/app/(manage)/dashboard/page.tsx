import { getTodaySummary, getUnsettledCount } from "@/lib/db/analytics";
import { getAuthContext } from "@/lib/auth";
import { DEMO_STORE_ID, formatCurrency } from "@/lib/utils";
import {
  DollarSign,
  Users,
  ShoppingBag,
  AlertTriangle,
  TrendingUp,
  Clock,
} from "lucide-react";

export default async function DashboardPage() {
  const ctx = await getAuthContext();
  const storeId = ctx?.storeId ?? DEMO_STORE_ID;

  let summary = { total_sales: 0, total_visitors: 0, total_orders: 0, avg_spend: 0, date: "" };
  let unsettled = 0;

  try {
    [summary, unsettled] = await Promise.all([
      getTodaySummary(),
      getUnsettledCount(),
    ]);
  } catch { /* demo */ }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* KPI行 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={<DollarSign />} label="本日売上" value={formatCurrency(summary.total_sales)} />
        <KPI icon={<Users />} label="来店数" value={`${summary.total_visitors}人`} />
        <KPI icon={<TrendingUp />} label="客単価" value={formatCurrency(summary.avg_spend)} />
        <KPI icon={<ShoppingBag />} label="注文数" value={`${summary.total_orders}件`} />
      </div>

      {/* アラート行 */}
      {unsettled > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-status-warning-bg border border-status-warning/20 rounded-[var(--radius-lg)] text-[13px]">
          <AlertTriangle className="w-4 h-4 text-status-warning flex-shrink-0" />
          <span className="text-status-warning font-medium">未精算 {unsettled}件</span>
          <span className="text-text-secondary">— 精算処理が必要です</span>
        </div>
      )}

      {/* 今日の状況 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="営業状況">
          <InfoRow label="営業開始" value="18:00" />
          <InfoRow label="現在来店" value={`${summary.total_visitors}名`} />
          <InfoRow label="稼働卓" value="—" />
          <InfoRow label="未精算" value={`${unsettled}件`} danger={unsettled > 0} />
        </Section>
        <Section title="勤怠">
          <InfoRow label="出勤中" value="—" />
          <InfoRow label="休憩中" value="—" />
          <div className="pt-2 mt-2 border-t border-border-light">
            <p className="text-[11px] text-text-tertiary flex items-center gap-1">
              <Clock className="w-3 h-3" />
              勤怠データは勤怠管理画面で確認できます
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
}

function KPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] px-4 py-3.5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-text-tertiary [&>svg]:w-[14px] [&>svg]:h-[14px]">{icon}</span>
        <span className="text-[11px] text-text-tertiary font-medium">{label}</span>
      </div>
      <p className="text-[20px] font-bold text-text-primary tracking-tight">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] p-4">
      <h2 className="text-[13px] font-semibold text-text-primary mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-text-secondary">{label}</span>
      <span className={`font-medium ${danger ? "text-status-danger" : "text-text-primary"}`}>{value}</span>
    </div>
  );
}
