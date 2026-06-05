"use client";

import Link from "next/link";
import { usePersisted } from "@/lib/persist/store";
import { customerStore, staffStore, reservationStore } from "@/lib/store/domain-stores";
import { PageHeader, Kpis, Kpi, Panel, VStack, Btn, Chip } from "@/components/v2/ui";

export default function V2DashboardPage() {
  const [customers] = usePersisted(customerStore);
  const [staff] = usePersisted(staffStore);
  const [reservations] = usePersisted(reservationStore);

  const activeStaff = staff.filter(s => s.status === "active").length;
  const onLeaveStaff = staff.filter(s => s.status === "leave").length;
  const todayReservations = reservations.filter(r => {
    const today = new Date().toISOString().slice(0, 10);
    return r.date === today;
  }).length;

  return (
    <VStack gap={20}>
      <PageHeader
        title="ダッシュボード"
        sub="店舗の今日"
        action={<Btn variant="primary"><Link href="/v2/checkin">入店登録</Link></Btn>}
      />

      <Kpis>
        <Kpi label="登録顧客" value={customers.length} sub={`VIP/GOLD ${customers.filter(c => c.rank === "vip" || c.rank === "gold").length}名`} />
        <Kpi label="在籍従業員" value={activeStaff} sub={onLeaveStaff > 0 ? `休職 ${onLeaveStaff}` : undefined} />
        <Kpi label="本日予約" value={todayReservations} />
        <Kpi label="売上(今日)" value="¥0" sub="—" />
      </Kpis>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Panel title="本日予約" action={<Link href="/v2/reservations" className="v2-mute" style={{ fontSize: 12 }}>全て →</Link>}>
          {reservations.length === 0 ? (
            <div className="v2-mute" style={{ fontSize: 13, padding: "8px 0" }}>予約はありません</div>
          ) : (
            <VStack gap={8}>
              {reservations.slice(0, 5).map(r => (
                <div key={r.id} className="v2-spread" style={{ padding: "8px 0", borderBottom: "1px solid var(--v2-border)" }}>
                  <div>
                    <div>{r.customerName}</div>
                    <div className="v2-mute" style={{ fontSize: 12 }}>{r.date} {r.time} · {r.party}名</div>
                  </div>
                  <Chip variant={r.status === "confirmed" ? "success" : r.status === "canceled" ? "danger" : undefined}>
                    {r.status === "confirmed" ? "確定" : r.status === "canceled" ? "キャンセル" : r.status === "arrived" ? "来店済" : r.status === "no_show" ? "ノーショー" : "未確定"}
                  </Chip>
                </div>
              ))}
            </VStack>
          )}
        </Panel>

        <Panel title="ショートカット">
          <VStack gap={6}>
            <Link href="/v2/customers" className="v2-row" style={{ padding: "10px 0", borderBottom: "1px solid var(--v2-border)" }}>顧客管理</Link>
            <Link href="/v2/tables" className="v2-row" style={{ padding: "10px 0", borderBottom: "1px solid var(--v2-border)" }}>卓管理</Link>
            <Link href="/v2/orders" className="v2-row" style={{ padding: "10px 0", borderBottom: "1px solid var(--v2-border)" }}>注文・精算</Link>
            <Link href="/v2/settings" className="v2-row" style={{ padding: "10px 0" }}>店舗設定</Link>
          </VStack>
        </Panel>
      </div>
    </VStack>
  );
}
