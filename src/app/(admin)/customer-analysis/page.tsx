import { getCustomerAnalytics } from "@/lib/db/analytics";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency, rankLabel, rankColor } from "@/lib/utils";

export default async function CustomerAnalysisPage() {
  let analytics: Awaited<ReturnType<typeof getCustomerAnalytics>> = [];

  try {
    analytics = await getCustomerAnalytics();
  } catch {
    // Supabase未接続時
  }

  const totalCustomers = analytics.length;
  const vipCount = analytics.filter((c) => c.rank === "vip").length;
  const repeatCustomers = analytics.filter((c) => c.visit_count >= 2).length;
  const repeatRate =
    totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">顧客分析</h1>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-sm text-muted-foreground">総顧客数</p>
          <p className="text-2xl font-bold mt-1">{totalCustomers}人</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">VIP顧客数</p>
          <p className="text-2xl font-bold mt-1">{vipCount}人</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">リピーター数</p>
          <p className="text-2xl font-bold mt-1">{repeatCustomers}人</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">再来店率</p>
          <p className="text-2xl font-bold mt-1">{repeatRate}%</p>
        </Card>
      </div>

      {/* 顧客ランキング */}
      <Card padding={false}>
        <div className="p-5 pb-3">
          <h2 className="text-lg font-semibold">顧客ランキング（累計利用額順）</h2>
        </div>
        {analytics.length === 0 ? (
          <div className="px-5 pb-5 text-sm text-muted-foreground">
            データがありません
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableHead>順位</TableHead>
              <TableHead>名前</TableHead>
              <TableHead>ランク</TableHead>
              <TableHead>来店回数</TableHead>
              <TableHead>累計利用額</TableHead>
              <TableHead>平均単価</TableHead>
            </TableHeader>
            <TableBody>
              {analytics.map((c, i) => (
                <TableRow key={c.customer_id}>
                  <TableCell className="font-medium">{i + 1}</TableCell>
                  <TableCell className="font-medium">{c.customer_name}</TableCell>
                  <TableCell>
                    <Badge variant="custom" className={rankColor(c.rank)}>
                      {rankLabel(c.rank)}
                    </Badge>
                  </TableCell>
                  <TableCell>{c.visit_count}回</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(c.total_spent)}
                  </TableCell>
                  <TableCell>{formatCurrency(c.avg_spend)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
