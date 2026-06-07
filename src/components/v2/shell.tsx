"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, type ReactNode } from "react";
import {
  Menu, LayoutDashboard, LogIn, Grid3X3, ShoppingBag, Bell, CalendarCheck,
  Users, UserCog, Clock, TrendingUp, Package, Lock, BarChart3, Coins, History,
  Trophy, Gift, CalendarDays, Image as ImageIcon, Settings, Sparkles,
  ChevronDown, ChevronRight, HelpCircle,
} from "lucide-react";

interface NavItem { href: string; label: string; icon: typeof LayoutDashboard; hasMenu?: boolean; }
interface NavSection { section: string; items: NavItem[]; }

const NAV: NavSection[] = [
  { section: "運営", items: [
    { href: "/v2", label: "ダッシュボード", icon: LayoutDashboard },
    { href: "/v2/checkin", label: "入店", icon: LogIn },
    { href: "/v2/tables", label: "卓", icon: Grid3X3, hasMenu: true },
    { href: "/v2/orders", label: "注文・精算", icon: ShoppingBag, hasMenu: true },
    { href: "/v2/live", label: "ライブ注文", icon: Bell },
    { href: "/v2/reservations", label: "予約", icon: CalendarCheck, hasMenu: true },
  ]},
  { section: "管理", items: [
    { href: "/v2/customers", label: "顧客", icon: Users, hasMenu: true },
    { href: "/v2/staff", label: "従業員", icon: UserCog, hasMenu: true },
    { href: "/v2/attendance", label: "勤怠", icon: Clock, hasMenu: true },
    { href: "/v2/sales", label: "売上", icon: TrendingUp, hasMenu: true },
    { href: "/v2/inventory", label: "在庫", icon: Package, hasMenu: true },
    { href: "/v2/closing", label: "締め", icon: Lock },
    { href: "/v2/reports", label: "集計", icon: BarChart3, hasMenu: true },
    { href: "/v2/chip-flow", label: "チップフロー", icon: Coins },
    { href: "/v2/history", label: "履歴", icon: History },
  ]},
  { section: "施策", items: [
    { href: "/v2/ranking", label: "ランキング", icon: Trophy },
    { href: "/v2/multike", label: "マルチケ配布", icon: Gift },
    { href: "/v2/events", label: "イベント", icon: CalendarDays, hasMenu: true },
    { href: "/v2/pop", label: "POP", icon: ImageIcon, hasMenu: true },
  ]},
  { section: "設定", items: [
    { href: "/v2/products", label: "商品マスタ", icon: Package, hasMenu: true },
    { href: "/v2/point-rules", label: "ポイントルール", icon: Sparkles, hasMenu: true },
    { href: "/v2/settings", label: "店舗設定", icon: Settings, hasMenu: true },
  ]},
];

export function V2Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  // 画面遷移したら自動で折りたたむ
  useEffect(() => { setExpanded(false); }, [pathname]);

  return (
    <div className="v2 v2-shell">
      <aside className={`v2-sidebar ${expanded ? "is-expanded" : ""}`}>
        {/* ===== トップ: ロゴ (展開時はシステム名も) ===== */}
        <div className="v2-sidebar-top">
          <Link href="/v2" className="v2-sidebar-top__brand" aria-label="ダッシュボードへ">
            <span className="v2-brand-mark">
              <Image src="/logo-icon.png" alt="みえるくん" width={44} height={44} priority />
            </span>
            {expanded && <span className="v2-sidebar-top__title">みえるくん</span>}
          </Link>
        </div>

        {/* ===== ナビ本体 ===== */}
        <nav className="v2-nav-wrap">
          {NAV.map((section) => (
            <div key={section.section}>
              <div className="v2-nav-section">{section.section}</div>
              {section.items.map((item) => {
                const active = item.href === "/v2" ? pathname === "/v2" : pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className={`v2-nav-item ${active ? "is-active" : ""}`}>
                    <span className="v2-nav-item__icon"><Icon size={18} strokeWidth={1.8} /></span>
                    <span className="v2-nav-item__label">{item.label}</span>
                    {item.hasMenu && (
                      <span className="v2-nav-item__chevron"><ChevronRight size={14} /></span>
                    )}
                    <span className="v2-nav-item__tip">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

      </aside>

      <div className="v2-main">
        <div className="v2-topbar">
          <button
            onClick={() => setExpanded(v => !v)}
            className="v2-icon-btn"
            aria-label={expanded ? "メニューを閉じる" : "メニューを開く"}
            title="メニュー"
          >
            <Menu size={18} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--v2-text-sub)" }}>
            {new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
          </span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <button className="v2-icon-btn" aria-label="通知" title="通知">
              <Bell size={17} />
              <span className="v2-icon-btn__dot" />
            </button>

            <button className="v2-store-pill" title="店舗を切替">
              <span className="v2-store-pill__mark">C</span>
              <span>Come On Casino</span>
              <ChevronDown size={12} style={{ color: "var(--v2-text-mute)" }} />
            </button>

            <button className="v2-icon-btn" aria-label="アカウント" title="アカウント" style={{ width: "auto", padding: "0 4px" }}>
              <span className="v2-avatar">力</span>
            </button>

            <button className="v2-icon-btn" aria-label="FAQ・ヘルプ" title="FAQ">
              <HelpCircle size={17} />
            </button>
          </div>
        </div>
        <main className="v2-body">{children}</main>
      </div>
    </div>
  );
}
