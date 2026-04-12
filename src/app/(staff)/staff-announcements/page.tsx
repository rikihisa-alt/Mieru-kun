import { getAnnouncements } from "@/lib/db/announcements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { getAuthContext } from "@/lib/auth";
import { DEMO_STORE_ID } from "@/lib/utils";

export default async function StaffAnnouncementsPage() {
  const ctx = await getAuthContext();
  const storeId = ctx?.storeId ?? DEMO_STORE_ID;

  let announcements: Awaited<ReturnType<typeof getAnnouncements>> = [];
  try {
    announcements = await getAnnouncements(storeId, "staff");
  } catch { /* demo mode */ }

  const targetBadge = (target: string) => {
    const map: Record<string, string> = { all: "全員", staff: "スタッフ", customers: "顧客" };
    return <Badge variant="default">{map[target] ?? target}</Badge>;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">お知らせ</h1>

      {announcements.length === 0 ? (
        <Card className="text-center py-8">
          <Bell className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">お知らせはまだありません</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {announcements.map(ann => (
            <Card key={ann.id}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm">{ann.title}</h3>
                {targetBadge(ann.target)}
              </div>
              {ann.body && <p className="text-sm text-muted-foreground mb-2">{ann.body}</p>}
              {ann.published_at && (
                <p className="text-xs text-muted-foreground">{formatDateTime(ann.published_at)}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
