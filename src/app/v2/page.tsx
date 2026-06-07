"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePersisted, usePersistedState } from "@/lib/persist/store";
import { customerStore, staffStore, reservationStore, productStore } from "@/lib/store/domain-stores";
import { salesOrderStore } from "@/lib/v2/stores";
import { PageHeader, Kpis, Kpi, Panel, VStack, HStack, Btn, Chip } from "@/components/v2/ui";
import { AlertTriangle, DoorOpen, ShoppingBag, Grid3X3, CreditCard, UserPlus, Plus, Clock } from "lucide-react";

interface CheckinVisit {
  id: string; customerId: string | null; name: string; rank: string; checkedInAt: string; table?: string;
}

export default function DashboardPage() {
  const [customers] = usePersisted(customerStore);
  const [staff] = usePersisted(staffStore);
  const [reservations] = usePersisted(reservationStore);
  const [products] = usePersisted(productStore);
  const [orders] = usePersisted(salesOrderStore);
  const [visits] = usePersistedState<CheckinVisit[]>("v2_visits_v1", []);

  const today = new Date().toISOString().slice(0, 10);
  const todaySales = useMemo(() => {
    const settled = orders.filter(o => o.status === "settled" && (o.settledAt ?? o.createdAt).startsWith(today));
    return { total: settled.reduce((s, o) => s + o.total, 0), count: settled.length };
  }, [orders, today]);

  const lowStock = products.filter(p => p.stock != null && p.minStock != null && p.stock <= p.minStock);
  const todayReservations = reservations.filter(r => r.date === today);
  const activeStaff = staff.filter(s => s.status === "active").length;

  return (
    <VStack gap={20}>
      <PageHeader
        title="ダッシュボード"
        action={
          <>
            <Btn variant="primary"><Link href="/v2/checkin" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><DoorOpen size={14}/> 入店登録</Link></Btn>
            <Btn variant="primary"><Link href="/v2/attendance" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Clock size={14}/> 出勤登録</Link></Btn>
          </>
        }
      />

      {/* 主要KPI */}
      <Kpis>
        <Kpi label="本日売上" value={`¥${todaySales.total.toLocaleString()}`} sub={`${todaySales.count}件`} />
        <Kpi label="来店中" value={visits.length} sub="名" />
        <Kpi label="本日予約" value={todayReservations.length} sub={todayReservations.length > 0 ? `次 ${todayReservations[0].time}` : undefined} />
        <Kpi label="在籍従業員" value={activeStaff} sub="名" />
      </Kpis>

      {/* アラート */}
      {lowStock.length > 0 && (
        <Panel>
          <HStack gap={8} style={{ color: "var(--v2-danger)" }}>
            <AlertTriangle size={16} />
            <strong>在庫不足:</strong>
            <span className="v2-grow v2-truncate">{lowStock.map(p => `${p.name}(${p.stock})`).join(" / ")}</span>
            <Link href="/v2/inventory" className="v2-mute" style={{ fontSize: 12 }}>確認 →</Link>
          </HStack>
        </Panel>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* 本日予約 */}
        <Panel title="本日予約" action={<Link href="/v2/reservations" className="v2-mute" style={{ fontSize: 12 }}>全て →</Link>}>
          {todayReservations.length === 0 ? (
            <div className="v2-mute" style={{ fontSize: 13, padding: "8px 0" }}>予約はありません</div>
          ) : (
            <VStack gap={0}>
              {todayReservations.slice(0, 5).map(r => (
                <HStack key={r.id} gap={8} style={{ padding: "10px 0", borderBottom: "1px solid var(--v2-border)" }}>
                  <span className="v2-num" style={{ width: 50 }}>{r.time}</span>
                  <div className="v2-grow">
                    <div>{r.customerName}</div>
                    <div className="v2-mute" style={{ fontSize: 11 }}>{r.party}名 · {r.source}</div>
                  </div>
                  <Chip variant={r.status === "confirmed" ? "success" : r.status === "canceled" ? "danger" : undefined}>
                    {r.status === "confirmed" ? "確定" : r.status === "canceled" ? "ｷｬﾝｾﾙ" : r.status === "arrived" ? "来店済" : "未確定"}
                  </Chip>
                </HStack>
              ))}
            </VStack>
          )}
        </Panel>

        {/* 来店中 */}
        <Panel title="来店中" action={<Link href="/v2/checkin" className="v2-mute" style={{ fontSize: 12 }}>全て →</Link>}>
          {visits.length === 0 ? (
            <div className="v2-mute" style={{ fontSize: 13, padding: "8px 0" }}>来店中のお客様はいません</div>
          ) : (
            <VStack gap={0}>
              {visits.slice(0, 5).map(v => (
                <HStack key={v.id} gap={8} style={{ padding: "10px 0", borderBottom: "1px solid var(--v2-border)" }}>
                  <span className="v2-num" style={{ width: 50 }}>
                    {new Date(v.checkedInAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <div className="v2-grow">
                    <div>{v.name}</div>
                    <div className="v2-mute" style={{ fontSize: 11 }}>{v.rank}{v.table && ` · ${v.table}`}</div>
                  </div>
                  {v.table && <Chip>{v.table}</Chip>}
                </HStack>
              ))}
            </VStack>
          )}
        </Panel>
      </div>

      {/* クイックアクション */}
      <Panel title="クイックアクション">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
          {[
            { href: "/v2/checkin", icon: DoorOpen, label: "入店登録" },
            { href: "/v2/tables", icon: Grid3X3, label: "卓管理" },
            { href: "/v2/orders", icon: ShoppingBag, label: "新規注文" },
            { href: "/v2/customers/new", icon: UserPlus, label: "顧客登録" },
            { href: "/v2/closing", icon: CreditCard, label: "締め処理" },
            { href: "/v2/reservations", icon: Plus, label: "予約追加" },
          ].map(a => {
            const Icon = a.icon;
            return (
              <Link key={a.href} href={a.href} className="v2-btn" style={{ height: 60, flexDirection: "column", gap: 4 }}>
                <Icon size={18} />
                <span style={{ fontSize: 12 }}>{a.label}</span>
              </Link>
            );
          })}
        </div>
      </Panel>

      {/* 顧客KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Panel title="顧客サマリ">
          <Kpis>
            <Kpi label="登録顧客" value={customers.length} />
            <Kpi label="VIP" value={customers.filter(c => c.rank === "vip").length} />
            <Kpi label="GOLD" value={customers.filter(c => c.rank === "gold").length} />
            <Kpi label="今月来店" value={customers.filter(c => (c.lastVisit ?? "") >= today.slice(0, 7).replace("-", "/")).length} />
          </Kpis>
        </Panel>

        <Panel title="商品・在庫">
          <Kpis>
            <Kpi label="商品" value={products.length} />
            <Kpi label="販売中" value={products.filter(p => p.active).length} />
            <Kpi label="在庫管理" value={products.filter(p => p.stock != null).length} />
            <Kpi label="在庫不足" value={lowStock.length} sub={lowStock.length > 0 ? "要発注" : "OK"} />
          </Kpis>
        </Panel>
      </div>
    </VStack>
  );
}
