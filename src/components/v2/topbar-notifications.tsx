"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CreditCard, PackageX, CalendarCheck } from "lucide-react";
import { usePersisted } from "@/lib/persist/store";
import { salesOrderStore } from "@/lib/v2/stores";
import { productStore, reservationStore } from "@/lib/store/domain-stores";

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function TopbarNotifications() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const [orders] = usePersisted(salesOrderStore);
  const [products] = usePersisted(productStore);
  const [reservations] = usePersisted(reservationStore);

  const unpaidCount = useMemo(() => orders.filter((o) => o.unpaid === true).length, [orders]);
  const lowStockItems = useMemo(
    () => products.filter((p) => p.stock != null && p.minStock != null && (p.stock ?? 0) <= (p.minStock ?? 0)),
    [products]
  );
  const todayReservationCount = useMemo(() => {
    const today = todayStr();
    return reservations.filter((r) => r.date === today && (r.status === "pending" || r.status === "confirmed")).length;
  }, [reservations]);

  const totalCount = unpaidCount + lowStockItems.length + (todayReservationCount > 0 ? 1 : 0);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const hasAny = totalCount > 0;

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        className="v2-icon-btn"
        aria-label="通知"
        title="通知"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={17} />
        {hasAny && <span className="v2-icon-btn__dot" />}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 320,
            background: "var(--v2-bg)",
            borderRadius: "var(--v2-radius-lg)",
            boxShadow: "var(--v2-shadow-lg)",
            border: "1px solid var(--v2-border)",
            zIndex: 70,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--v2-border)", fontSize: 13, fontWeight: 600, color: "var(--v2-text)" }}>
            通知
          </div>

          {!hasAny && (
            <div style={{ padding: "24px 14px", textAlign: "center", fontSize: 13, color: "var(--v2-text-mute)" }}>
              新しい通知はありません
            </div>
          )}

          {hasAny && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {unpaidCount > 0 && (
                <Link
                  href="/v2/orders"
                  onClick={() => setOpen(false)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", fontSize: 13, color: "var(--v2-text)", borderBottom: "1px solid var(--v2-border)" }}
                >
                  <CreditCard size={16} style={{ color: "var(--v2-danger)", flexShrink: 0 }} />
                  <span>未払いの注文が <b>{unpaidCount}</b> 件あります</span>
                </Link>
              )}
              {lowStockItems.length > 0 && (
                <Link
                  href="/v2/inventory"
                  onClick={() => setOpen(false)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", fontSize: 13, color: "var(--v2-text)", borderBottom: "1px solid var(--v2-border)" }}
                >
                  <PackageX size={16} style={{ color: "var(--v2-danger)", flexShrink: 0 }} />
                  <span>在庫僅少の商品が <b>{lowStockItems.length}</b> 件あります</span>
                </Link>
              )}
              {todayReservationCount > 0 && (
                <Link
                  href="/v2/reservations"
                  onClick={() => setOpen(false)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", fontSize: 13, color: "var(--v2-text)" }}
                >
                  <CalendarCheck size={16} style={{ color: "var(--v2-accent-text)", flexShrink: 0 }} />
                  <span>本日の予約が <b>{todayReservationCount}</b> 件あります</span>
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
