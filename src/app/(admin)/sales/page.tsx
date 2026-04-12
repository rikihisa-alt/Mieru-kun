import { getProductSales } from "@/lib/db/analytics";
import { getRecentClosings } from "@/lib/db/daily-closings";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency, todayString } from "@/lib/utils";
import { SalesChart } from "./chart";

export default async function SalesPage() {
  let closings: Awaited<ReturnType<typeof getRecentClosings>> = [];
  let productSales: Awaited<ReturnType<typeof getProductSales>> = [];

  try {
    const today = todayString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
      .toISOString()
      .split("T")[0];
    [closings, productSales] = await Promise.all([
      getRecentClosings(30),
      getProductSales(thirtyDaysAgo, today),
    ]);
  } catch {
    // Supabase未接続時
  }

  const totalRevenue = closings.reduce((s, c) => s + c.total_sales, 0);
  const totalVisitors = closings.reduce((s, c) => s + c.total_visitors, 0);
  const avgDaily = closings.length > 0 ? Math.round(totalRevenue / closings.length) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">売上分析</h1>

      {/* サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-muted-foreground">期間売上合計</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalRevenue)}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">1日平均売上</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(avgDaily)}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">期間来店者数</p>
          <p className="text-2xl font-bold mt-1">{totalVisitors}人</p>
        </Card>
      </div>

      {/* 日別売上グラフ */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">日別売上推移</h2>
        <SalesChart
          data={closings.map((c) => ({
            date: c.date.slice(5),
            sales: c.total_sales,
            visitors: c.total_visitors,
          }))}
        />
      </Card>

      {/* 商品別売上 */}
      <Card padding={false}>
        <div className="p-5 pb-3">
          <h2 className="text-lg font-semibold">商品別売上</h2>
        </div>
        {productSales.length === 0 ? (
          <div className="px-5 pb-5 text-sm text-muted-foreground">
            データがありません
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableHead>商品名</TableHead>
              <TableHead>販売数</TableHead>
              <TableHead>売上</TableHead>
            </TableHeader>
            <TableBody>
              {productSales.map((p, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{p.product_name}</TableCell>
                  <TableCell>{p.quantity_sold}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(p.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
