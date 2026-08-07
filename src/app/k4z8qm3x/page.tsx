"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePersisted, usePersistedState } from "@/lib/persist/store";
import { customerStore, staffStore, reservationStore, productStore } from "@/lib/store/domain-stores";
import { salesOrderStore } from "@/lib/v2/stores";
import { useOrders } from "@/lib/orders/store";
import { PageHeader, Kpis, Kpi, Panel, VStack, HStack, Btn, Chip } from "@/components/v2/ui";
import {
  AlertTriangle, DoorOpen, ShoppingBag, Grid3X3, CreditCard, UserPlus, Plus, Clock, Wallet, CheckCircle2,
  Bell, Receipt, Armchair, Hourglass, AlarmClockOff, CalendarClock, PackageX, Lock, ClipboardList, ChevronRight,
  type LucideIcon,
} from "lucide-react";

interface CheckinVisit {
  id: string; customerId: string | null; name: string; rank: string; checkedInAt: string; tableId?: string; seatIndex?: number;
}

// ===== 「今日やること」Action Center 用の最小型定義 =====
// 各storeの完全な型は該当ページ (tables/shifts/closing) に定義済み。ここでは判定に必要なフィールドのみ再定義する。
interface ActionWaitEntry { id: string; status: "waiting" | "called"; }
interface ActionShiftEntry { staffId: string; date: string; }
interface ActionAttendanceRecord { staffId: string; date: string; clockIn?: string; }
interface ActionClosingRecord { date: string; }

/** Action Center の1行。行全体がクリック可能なリンクで、遷移先へ飛ぶ。 */
function ActionRow({ href, icon: Icon, label, count, unit, tone }: {
  href: string; icon: LucideIcon; label: string; count: number; unit: string; tone: "danger" | "warn" | "info" | "accent";
}) {
  const [hover, setHover] = useState(false);
  const toneVar = `var(--v2-${tone})`;
  return (
    <Link
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderLeft: `3px solid ${toneVar}`,
        borderRadius: 6,
        background: hover ? "var(--v2-bg-alt)" : "transparent",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <Icon size={16} color={toneVar} style={{ flexShrink: 0 }} />
      <span className="v2-grow" style={{ fontSize: 13 }}>
        {label} <span className="v2-num" style={{ fontWeight: 600 }}>{count}{unit}</span>
      </span>
      <ChevronRight size={16} className="v2-mute" style={{ flexShrink: 0 }} />
    </Link>
  );
}

export default function DashboardPage() {
  const [customers] = usePersisted(customerStore);
  const [staff] = usePersisted(staffStore);
  const [reservations] = usePersisted(reservationStore);
  const [products] = usePersisted(productStore);
  const [orders] = usePersisted(salesOrderStore);
  const [visits] = usePersistedState<CheckinVisit[]>("v2_visits_v1", []);

  // ===== Action Center 用データ (すべて既存storeの読み取りのみ。新規persistキーは作らない) =====
  const liveOrders = useOrders();
  const [waitlist] = usePersistedState<ActionWaitEntry[]>("v2_waitlist_v1", []);
  const [shifts] = usePersistedState<ActionShiftEntry[]>("v2_shifts_v1", []);
  const [attendance] = usePersistedState<ActionAttendanceRecord[]>("v2_attendance_v1", []);
  const [closings] = usePersistedState<ActionClosingRecord[]>("v2_closings_v1", []);

  const today = new Date().toISOString().slice(0, 10);
  const todaySales = useMemo(() => {
    const settled = orders.filter(o => o.status === "settled" && (o.settledAt ?? o.createdAt).startsWith(today));
    return { total: settled.reduce((s, o) => s + o.total, 0), count: settled.length };
  }, [orders, today]);

  const lowStock = products.filter(p => p.stock != null && p.minStock != null && p.stock <= p.minStock);
  const todayReservations = reservations.filter(r => r.date === today);
  const activeStaff = staff.filter(s => s.status === "active").length;

  const unpaidOrders = useMemo(
    () => orders.filter(o => o.status === "settled" && o.paymentMethod === "credit" && o.unpaid)
      .sort((a, b) => (b.settledAt ?? b.createdAt).localeCompare(a.settledAt ?? a.createdAt)),
    [orders]
  );
  const unpaidTotal = unpaidOrders.reduce((s, o) => s + o.total, 0);

  // ===== Action Center: 「今日やること」件数計算 =====
  const activeOrderCount = liveOrders.filter(o => o.status !== "done" && o.status !== "canceled").length;
  const activeSalesOrderCount = orders.filter(o => o.status === "active").length;
  const unseatedVisitCount = visits.filter(v => !v.tableId).length;
  const waitingCount = waitlist.filter(w => w.status === "waiting" || w.status === "called").length;
  // 出勤予定だが未打刻: 本日シフトがある在籍中(active)スタッフのうち、本日のclockInが無い人数 (shifts/page.tsx の isNoShowWarning と同じロジック)
  const noShowCount = useMemo(() => {
    const activeStaffIds = new Set(staff.filter(s => s.status === "active").map(s => s.id));
    const todayStaffIds = new Set(shifts.filter(s => s.date === today && activeStaffIds.has(s.staffId)).map(s => s.staffId));
    let count = 0;
    todayStaffIds.forEach(staffId => {
      const att = attendance.find(a => a.staffId === staffId && a.date === today);
      if (!att?.clockIn) count++;
    });
    return count;
  }, [staff, shifts, attendance, today]);
  const pendingReservationCount = todayReservations.filter(r => r.status === "pending" || r.status === "confirmed").length;
  // 締め未完了: 目障りにならないよう、営業終盤 (22時以降) かつ本日の締めレコードが無い場合のみ表示
  const isLateHour = new Date().getHours() >= 22;
  const closingMissing = isLateHour && !closings.some(c => c.date === today);

  type ActionItem = { key: string; href: string; icon: LucideIcon; label: string; count: number; unit: string; tone: "danger" | "warn" | "info" | "accent" };
  const allActionItems: ActionItem[] = [
    { key: "orders", href: "/k4z8qm3x/live", icon: Bell, label: "未対応注文", count: activeOrderCount, unit: "件", tone: "danger" },
    { key: "unsettled", href: "/k4z8qm3x/orders", icon: Receipt, label: "未精算", count: activeSalesOrderCount, unit: "件", tone: "danger" },
    { key: "unseated", href: "/k4z8qm3x/tables", icon: Armchair, label: "未着席", count: unseatedVisitCount, unit: "名", tone: "warn" },
    { key: "waiting", href: "/k4z8qm3x/tables", icon: Hourglass, label: "ウェイティング", count: waitingCount, unit: "組", tone: "warn" },
    { key: "noshow", href: "/k4z8qm3x/attendance", icon: AlarmClockOff, label: "出勤予定だが未打刻", count: noShowCount, unit: "名", tone: "warn" },
    { key: "reservations", href: "/k4z8qm3x/reservations", icon: CalendarClock, label: "本日の予約(未対応)", count: pendingReservationCount, unit: "件", tone: "info" },
    { key: "lowstock", href: "/k4z8qm3x/inventory", icon: PackageX, label: "在庫注意", count: lowStock.length, unit: "品目", tone: "info" },
    { key: "closing", href: "/k4z8qm3x/closing", icon: Lock, label: "締め未完了", count: closingMissing ? 1 : 0, unit: "", tone: "accent" },
  ];
  const actionItems = allActionItems.filter(item => item.count > 0);

  return (
    <VStack gap={16}>
      <PageHeader
        title="ダッシュボード"
        action={
          <>
            <Btn variant="primary"><Link href="/k4z8qm3x/checkin" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><DoorOpen size={14}/> 入店登録</Link></Btn>
            <Btn variant="primary"><Link href="/k4z8qm3x/attendance" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Clock size={14}/> 出勤登録</Link></Btn>
          </>
        }
      />

      {/* 今日やること (Action Center): 営業中に対応が必要な項目を優先度順に表示し、クリックで該当画面へ遷移 */}
      <Panel title={<HStack gap={6}><ClipboardList size={15} /> 今日やること</HStack>}>
        {actionItems.length === 0 ? (
          <HStack gap={8} className="v2-mute" style={{ fontSize: 13, padding: "8px 0" }}>
            <CheckCircle2 size={16} /> 対応が必要なことはありません。順調です 👍
          </HStack>
        ) : (
          <VStack gap={4}>
            {actionItems.map(item => (
              <ActionRow key={item.key} href={item.href} icon={item.icon} label={item.label} count={item.count} unit={item.unit} tone={item.tone} />
            ))}
          </VStack>
        )}
      </Panel>

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
            <Link href="/k4z8qm3x/inventory" className="v2-mute" style={{ fontSize: 12 }}>確認 →</Link>
          </HStack>
        </Panel>
      )}

      {/* 未払い(後払い) */}
      <Panel
        title={<HStack gap={6}><Wallet size={15} /> 未払い(後払い)</HStack>}
        action={<Link href="/k4z8qm3x/sales?tab=unpaid" className="v2-mute" style={{ fontSize: 12 }}>一覧・消し込み →</Link>}
      >
        {unpaidOrders.length === 0 ? (
          <HStack gap={8} className="v2-mute" style={{ fontSize: 13, padding: "8px 0" }}>
            <CheckCircle2 size={16} /> 未払いはありません
          </HStack>
        ) : (
          <VStack gap={12}>
            <HStack gap={16}>
              <div>
                <div className="v2-mute" style={{ fontSize: 12 }}>件数</div>
                <div className="v2-num" style={{ fontSize: 20, fontWeight: 600 }}>{unpaidOrders.length}件</div>
              </div>
              <div>
                <div className="v2-mute" style={{ fontSize: 12 }}>合計金額</div>
                <div className="v2-num" style={{ fontSize: 20, fontWeight: 600, color: "var(--v2-warn)" }}>¥{unpaidTotal.toLocaleString()}</div>
              </div>
            </HStack>
            <VStack gap={0}>
              {unpaidOrders.slice(0, 5).map(o => (
                <HStack key={o.id} gap={8} style={{ padding: "8px 0", borderBottom: "1px solid var(--v2-border)" }}>
                  <div className="v2-grow">
                    <div>{o.customer}</div>
                    <div className="v2-mute" style={{ fontSize: 11 }}>{(o.settledAt ?? o.createdAt).slice(0, 10)}</div>
                  </div>
                  <span className="v2-num" style={{ fontWeight: 600 }}>¥{o.total.toLocaleString()}</span>
                </HStack>
              ))}
            </VStack>
          </VStack>
        )}
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {/* 本日予約 */}
        <Panel title="本日予約" action={<Link href="/k4z8qm3x/reservations" className="v2-mute" style={{ fontSize: 12 }}>全て →</Link>}>
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
        <Panel title="来店中" action={<Link href="/k4z8qm3x/checkin" className="v2-mute" style={{ fontSize: 12 }}>全て →</Link>}>
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
                    <div className="v2-mute" style={{ fontSize: 11 }}>{v.rank}{v.tableId && ` · 着席`}</div>
                  </div>
                  {v.tableId && <Chip>{v.seatIndex != null ? `席${v.seatIndex + 1}` : "着席"}</Chip>}
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
            { href: "/k4z8qm3x/checkin", icon: DoorOpen, label: "入店登録" },
            { href: "/k4z8qm3x/tables", icon: Grid3X3, label: "卓管理" },
            { href: "/k4z8qm3x/orders", icon: ShoppingBag, label: "新規注文" },
            { href: "/k4z8qm3x/customers/new", icon: UserPlus, label: "顧客登録" },
            { href: "/k4z8qm3x/closing", icon: CreditCard, label: "締め処理" },
            { href: "/k4z8qm3x/reservations", icon: Plus, label: "予約追加" },
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
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
