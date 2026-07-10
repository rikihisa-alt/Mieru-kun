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
    <div className="ln-page">
      <div className="ln-stack">
        {/* 速報 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <MiniKPI icon={<DollarSign size={12} />} label="売上" value={formatCurrency(summary.total_sales)} />
          <MiniKPI icon={<Users size={12} />} label="来店" value={`${summary.total_visitors}人`} />
        </div>

        {unsettled > 0 && (
          <div
            className="ln-row"
            style={{
              padding: "10px 12px",
              background: "var(--ln-warn-soft)",
              borderRadius: "var(--ln-radius-sm)",
              fontSize: 12,
            }}
          >
            <AlertTriangle size={14} style={{ color: "var(--ln-warn)" }} />
            <span style={{ color: "var(--ln-warn)", fontWeight: 500 }}>未精算 {unsettled}件</span>
          </div>
        )}

        {/* 管理画面リンク */}
        <Link href="/k4z8qm3x" className="ln-btn ln-btn--full">
          <Monitor size={16} />
          管理画面を開く
        </Link>
      </div>
    </div>
  );
}

function MiniKPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="ln-card ln-card-compact">
      <div className="ln-row" style={{ marginBottom: 2 }}>
        <span className="ln-mute">{icon}</span>
        <span className="ln-mute" style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
      </div>
      <p className="ln-num" style={{ fontSize: 18, fontWeight: 700, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={value}>{value}</p>
    </div>
  );
}
