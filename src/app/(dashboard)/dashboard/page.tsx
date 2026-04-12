import {
  TrendingUp,
  Store,
  Users,
  DollarSign,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ダッシュボード</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          title="本日の売上"
          value="¥0"
          change="-"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <SummaryCard
          title="月間売上"
          value="¥0"
          change="-"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <SummaryCard
          title="登録店舗数"
          value="0"
          change=""
          icon={<Store className="w-5 h-5" />}
        />
        <SummaryCard
          title="スタッフ数"
          value="0"
          change=""
          icon={<Users className="w-5 h-5" />}
        />
      </div>

      {/* Placeholder Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">売上推移</h2>
          <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-border rounded-lg">
            店舗を登録すると売上グラフが表示されます
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">店舗別売上</h2>
          <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-border rounded-lg">
            店舗を登録すると比較データが表示されます
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  change,
  icon,
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{title}</span>
        <div className="text-primary">{icon}</div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {change && (
        <p className="text-xs text-gray-500 mt-1">{change}</p>
      )}
    </div>
  );
}
