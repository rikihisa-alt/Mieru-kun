import { getEventById, getEventEntries } from "@/lib/db/events";
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
import { formatDate, formatDateTime } from "@/lib/utils";
import { CalendarDays } from "lucide-react";
import type { EventRecord, EventEntry } from "@/types/database";
import Link from "next/link";

const statusLabel: Record<string, string> = {
  draft: "下書き",
  published: "公開中",
  ended: "終了",
};

const statusVariant: Record<string, "default" | "success" | "warning" | "info"> = {
  draft: "default",
  published: "success",
  ended: "info",
};

const entryStatusLabel: Record<string, string> = {
  reserved: "予約済",
  attended: "参加済",
  cancelled: "キャンセル",
};

const entryStatusVariant: Record<string, "default" | "success" | "warning" | "danger"> = {
  reserved: "warning",
  attended: "success",
  cancelled: "danger",
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let event: EventRecord | null = null;
  let entries: EventEntry[] = [];

  try {
    [event, entries] = await Promise.all([
      getEventById(id),
      getEventEntries(id),
    ]);
  } catch {
    // デモモード
  }

  if (!event) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">イベントが見つかりません</h1>
        <Link href="/events" className="text-primary hover:underline text-sm">
          イベント一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/events"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; イベント一覧
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <CalendarDays className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <Badge variant={statusVariant[event.status] ?? "default"}>
          {statusLabel[event.status] ?? event.status}
        </Badge>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">開催日</p>
            <p className="font-medium">
              {event.event_date ? formatDate(event.event_date) : "未定"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">定員</p>
            <p className="font-medium">
              {event.capacity ? `${event.capacity}名` : "制限なし"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">エントリー数</p>
            <p className="font-medium">{entries.length}名</p>
          </div>
        </div>
        {event.description && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-1">説明</p>
            <p className="text-sm">{event.description}</p>
          </div>
        )}
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">エントリー一覧</h2>
        <Card padding={false}>
          {entries.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              エントリーがまだありません
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableHead>顧客名</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>登録日時</TableHead>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const customer = (entry as unknown as Record<string, unknown>)
                    .customer as { name: string } | null;
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {customer?.name ?? entry.customer_id}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            entryStatusVariant[entry.status] ?? "default"
                          }
                        >
                          {entryStatusLabel[entry.status] ?? entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(entry.created_at)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
