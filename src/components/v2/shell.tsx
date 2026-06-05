"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, type ReactNode } from "react";
import { Menu, X } from "lucide-react";

const NAV: { section: string; items: { href: string; label: string }[] }[] = [
  { section: "運営", items: [
    { href: "/v2", label: "ダッシュボード" },
    { href: "/v2/checkin", label: "入店" },
    { href: "/v2/tables", label: "卓" },
    { href: "/v2/orders", label: "注文・精算" },
    { href: "/v2/live", label: "ライブ注文" },
    { href: "/v2/reservations", label: "予約" },
  ]},
  { section: "管理", items: [
    { href: "/v2/customers", label: "顧客" },
    { href: "/v2/staff", label: "従業員" },
    { href: "/v2/attendance", label: "勤怠" },
    { href: "/v2/closing", label: "締め" },
    { href: "/v2/reports", label: "集計" },
    { href: "/v2/chip-flow", label: "チップフロー" },
    { href: "/v2/history", label: "履歴" },
  ]},
  { section: "施策", items: [
    { href: "/v2/ranking", label: "ランキング" },
    { href: "/v2/multike", label: "マルチケ配布" },
    { href: "/v2/events", label: "イベント" },
    { href: "/v2/pop", label: "POP" },
  ]},
  { section: "設定", items: [
    { href: "/v2/products", label: "商品マスタ" },
    { href: "/v2/point-rules", label: "ポイントルール" },
    { href: "/v2/settings", label: "店舗設定" },
  ]},
];

export function V2Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <div className="v2 v2-shell">
      <aside className={`v2-sidebar ${open ? "v2-sidebar--open" : ""}`}>
        <div className="v2-brand">てんぽみえるくん</div>
        <nav>
          {NAV.map((section) => (
            <div key={section.section}>
              <div className="v2-nav-section">{section.section}</div>
              {section.items.map((item) => {
                const active = item.href === "/v2" ? pathname === "/v2" : pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link key={item.href} href={item.href} className={`v2-nav-item ${active ? "is-active" : ""}`}>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
          <div style={{ height: 16 }} />
        </nav>
      </aside>

      <div className="v2-main">
        <div className="v2-topbar">
          <button onClick={() => setOpen((v) => !v)} className="v2-btn-ghost" aria-label="menu" style={{ height: 28, width: 28, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
          <span className="v2-mute" style={{ fontSize: 12 }}>
            {new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
          </span>
        </div>
        <main className="v2-body">{children}</main>
      </div>
    </div>
  );
}
