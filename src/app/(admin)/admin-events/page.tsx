import Link from "next/link";
import { getEvents } from "@/lib/db/events";
import { getAuthContext } from "@/lib/auth";
import { DEMO_STORE_ID, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";
import type { EventRecord } from "@/types/database";

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

export default async function EventsPage() {
  const ctx = await getAuthContext();
  const storeId = ctx?.storeId ?? DEMO_STORE_ID;

  let events: EventRecord[] = [];

  try {
    events = await getEvents(storeId);
  } catch {
    // デモモード
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CalendarDays className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">イベント管理</h1>
          <p className="text-sm text-muted-foreground">
            {events.length}件のイベント
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <Card>
          <div className="text-center text-sm text-muted-foreground py-4">
            イベントがまだ登録されていません
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{event.title}</h3>
                  <Badge variant={statusVariant[event.status] ?? "default"}>
                    {statusLabel[event.status] ?? event.status}
                  </Badge>
                </div>
                {event.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {event.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {event.event_date && (
                    <span>{formatDate(event.event_date)}</span>
                  )}
                  {event.capacity && <span>定員: {event.capacity}名</span>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
