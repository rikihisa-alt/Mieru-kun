import { StatCard } from "@/components/ui/card";
import { Card } from "@/components/ui/card";
import { Briefcase, Users, Clock, DollarSign, Percent } from "lucide-react";
import { getAuthContext } from "@/lib/auth";
import { DEMO_STORE_ID, formatCurrency } from "@/lib/utils";
import { getStaffList } from "@/lib/db/staff";

export default async function HrAnalysisPage() {
  const ctx = await getAuthContext();
  const storeId = ctx?.storeId ?? DEMO_STORE_ID;

  let staffCount = 0;
  let totalWorkHours = 0;
  let estimatedLaborCost = 0;
  let laborCostRatio = 0;

  try {
    const staffList = await getStaffList(storeId);
    staffCount = staffList.length;
    // 実データからの算出は今後実装
  } catch {
    // デモモード
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Briefcase className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">人件費分析</h1>
          <p className="text-sm text-muted-foreground">
            月次の人件費・勤怠サマリー
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="スタッフ数"
          value={`${staffCount}名`}
          icon={<Users className="w-6 h-6" />}
        />
        <StatCard
          title="総勤務時間（今月）"
          value={`${totalWorkHours}時間`}
          icon={<Clock className="w-6 h-6" />}
        />
        <StatCard
          title="推定人件費"
          value={formatCurrency(estimatedLaborCost)}
          icon={<DollarSign className="w-6 h-6" />}
        />
        <StatCard
          title="人件費率"
          value={`${laborCostRatio}%`}
          icon={<Percent className="w-6 h-6" />}
        />
      </div>

      <Card>
        <div className="text-center py-12">
          <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-semibold text-muted-foreground">
            勤怠データから自動算出されます
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            スタッフの打刻データが蓄積されると、人件費の詳細分析が表示されます
          </p>
        </div>
      </Card>
    </div>
  );
}
