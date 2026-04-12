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
import { formatCurrency, formatDate } from "@/lib/utils";
import { ClipboardCheck } from "lucide-react";
import type { DailyClosing } from "@/types/database";

export default async function ClosingHistoryPage() {
  let closings: DailyClosing[] = [];

  try {
    closings = await getRecentClosings(90);
  } catch {
    // デモモード
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardCheck className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">締め履歴</h1>
          <p className="text-sm text-muted-foreground">
            直近{closings.length}件の締めデータ
          </p>
        </div>
      </div>

      <Card padding={false}>
        {closings.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            締めデータがまだありません
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableHead>日付</TableHead>
              <TableHead>売上合計</TableHead>
              <TableHead>来店数</TableHead>
              <TableHead>注文数</TableHead>
              <TableHead>現金</TableHead>
              <TableHead>カード</TableHead>
              <TableHead>電子マネー</TableHead>
            </TableHeader>
            <TableBody>
              {closings.map((closing) => (
                <TableRow key={closing.id}>
                  <TableCell className="font-medium">
                    {formatDate(closing.date)}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(closing.total_sales)}
                  </TableCell>
                  <TableCell>{closing.total_visitors}人</TableCell>
                  <TableCell>{closing.total_orders}件</TableCell>
                  <TableCell>{formatCurrency(closing.cash_amount)}</TableCell>
                  <TableCell>{formatCurrency(closing.card_amount)}</TableCell>
                  <TableCell>
                    {formatCurrency(closing.electronic_amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
