import { getEvents } from "@/lib/db/events";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getAuthContext } from "@/lib/auth";
import { DEMO_STORE_ID } from "@/lib/utils";

export default async function StaffEventsPage() {
  const ctx = await getAuthContext();
  const storeId = ctx?.storeId ?? DEMO_STORE_ID;

  let events: Awaited<ReturnType<typeof getEvents>> = [];
  try {
    events = await getEvents(storeId);
  } catch { /* demo mode */ }

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "success" | "default" | "info" }> = {
      draft: { label: "下書き", variant: "default" },
      published: { label: "公開中", variant: "success" },
      ended: { label: "終了", variant: "info" },
    };
    const s = map[status] ?? { label: status, variant: "default" as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">イベント</h1>

      {events.length === 0 ? (
        <Card className="text-center py-8">
          <CalendarDays className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">イベントはまだありません</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {events.map(event => (
            <Card key={event.id}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm">{event.title}</h3>
                {statusBadge(event.status)}
              </div>
              {event.description && (
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{event.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {event.event_date && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {formatDate(event.event_date)}
                  </span>
                )}
                {event.capacity && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    定員 {event.capacity}名
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
