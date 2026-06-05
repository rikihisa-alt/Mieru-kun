"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, type ReactNode } from "react";
import {
  Menu, X, LayoutDashboard, LogIn, Grid3X3, ShoppingBag, Bell, CalendarCheck,
  Users, UserCog, Clock, TrendingUp, Package, Lock, BarChart3, Coins, History,
  Trophy, Gift, CalendarDays, Image as ImageIcon, Settings, Sparkles, ChevronDown,
} from "lucide-react";

interface NavItem { href: string; label: string; icon: typeof LayoutDashboard; }
interface NavSection { section: string; items: NavItem[]; }

const NAV: NavSection[] = [
  { section: "運営", items: [
    { href: "/v2", label: "ダッシュボード", icon: LayoutDashboard },
    { href: "/v2/checkin", label: "入店", icon: LogIn },
    { href: "/v2/tables", label: "卓", icon: Grid3X3 },
    { href: "/v2/orders", label: "注文・精算", icon: ShoppingBag },
    { href: "/v2/live", label: "ライブ注文", icon: Bell },
    { href: "/v2/reservations", label: "予約", icon: CalendarCheck },
  ]},
  { section: "管理", items: [
    { href: "/v2/customers", label: "顧客", icon: Users },
    { href: "/v2/staff", label: "従業員", icon: UserCog },
    { href: "/v2/attendance", label: "勤怠", icon: Clock },
    { href: "/v2/sales", label: "売上", icon: TrendingUp },
    { href: "/v2/inventory", label: "在庫", icon: Package },
    { href: "/v2/closing", label: "締め", icon: Lock },
    { href: "/v2/reports", label: "集計", icon: BarChart3 },
    { href: "/v2/chip-flow", label: "チップフロー", icon: Coins },
    { href: "/v2/history", label: "履歴", icon: History },
  ]},
  { section: "施策", items: [
    { href: "/v2/ranking", label: "ランキング", icon: Trophy },
    { href: "/v2/multike", label: "マルチケ配布", icon: Gift },
    { href: "/v2/events", label: "イベント", icon: CalendarDays },
    { href: "/v2/pop", label: "POP", icon: ImageIcon },
  ]},
  { section: "設定", items: [
    { href: "/v2/products", label: "商品マスタ", icon: Package },
    { href: "/v2/point-rules", label: "ポイントルール", icon: Sparkles },
    { href: "/v2/settings", label: "店舗設定", icon: Settings },
  ]},
];

export function V2Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <div className="v2 v2-shell">
      <aside className={`v2-sidebar ${open ? "v2-sidebar--open" : ""}`}>
        <div className="v2-brand">
          <span className="v2-brand-mark">店</span>
          <span>てんぽみえるくん</span>
        </div>
        <nav style={{ flex: 1, paddingBottom: 16 }}>
          {NAV.map((section) => (
            <div key={section.section}>
              <div className="v2-nav-section">{section.section}</div>
              {section.items.map((item) => {
                const active = item.href === "/v2" ? pathname === "/v2" : pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className={`v2-nav-item ${active ? "is-active" : ""}`}>
                    <span className="v2-nav-item__icon"><Icon size={16} /></span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div style={{ padding: "12px 18px", borderTop: "1px solid rgba(255,255,255,0.4)", fontSize: 11, color: "var(--v2-text-mute)" }}>
          Come On Casino
        </div>
      </aside>

      <div className="v2-main">
        <div className="v2-topbar">
          <button onClick={() => setOpen((v) => !v)} className="v2-btn-ghost" aria-label="menu" style={{ height: 32, width: 32, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--v2-text-sub)" }}>
            {new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
          </span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <span className="v2-chip v2-chip-success">スタンダードプラン</span>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, background: "var(--v2-bg-hover)", fontSize: 12, color: "var(--v2-text-sub)" }}>
              <span style={{ width: 22, height: 22, borderRadius: 11, background: "var(--v2-accent-soft)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--v2-accent-text)", fontSize: 11, fontWeight: 600 }}>C</span>
              <span>店舗管理</span>
              <ChevronDown size={12} style={{ color: "var(--v2-text-mute)" }} />
            </div>
          </div>
        </div>
        <main className="v2-body">{children}</main>
      </div>
    </div>
  );
}
