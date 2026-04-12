import { getAuditLogs } from "@/lib/db/audit-logs";
import { getAuthContext } from "@/lib/auth";
import { DEMO_STORE_ID, formatDateTime } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { FileText } from "lucide-react";
import type { OperationLog } from "@/types/database";

export default async function AuditLogsPage() {
  const ctx = await getAuthContext();
  const storeId = ctx?.storeId ?? DEMO_STORE_ID;

  let logs: OperationLog[] = [];

  try {
    logs = await getAuditLogs(storeId);
  } catch {
    // デモモード
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">監査ログ</h1>
          <p className="text-sm text-muted-foreground">
            {logs.length}件のログ
          </p>
        </div>
      </div>

      <Card padding={false}>
        {logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            監査ログがまだありません
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableHead>日時</TableHead>
              <TableHead>アクション</TableHead>
              <TableHead>スタッフ</TableHead>
              <TableHead>対象</TableHead>
              <TableHead>詳細</TableHead>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {formatDateTime(log.created_at)}
                  </TableCell>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.staff_id ? log.staff_id.slice(0, 8) + "..." : "-"}
                  </TableCell>
                  <TableCell>{log.target_type ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs max-w-xs truncate">
                    {log.detail ? JSON.stringify(log.detail) : "-"}
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
