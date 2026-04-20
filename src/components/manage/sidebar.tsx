"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  DoorOpen,
  Grid3X3,
  ShoppingBag,
  Users,
  UserPlus,
  Clock,
  Lock,
  Package,
  Settings,
  History,
  CalendarDays,
  Activity,
  Trophy,
  Gift,
  ImageIcon,
  Sparkles,
  ShieldCheck,
  BarChart3,
} from "lucide-react";

const NAV = [
  { section: "運営", items: [
    { href: "/h7p2kx", label: "ダッシュボード", icon: LayoutGrid },
    { href: "/m4w9sq", label: "入店管理", icon: DoorOpen },
    { href: "/k3f8qm", label: "来店予約", icon: CalendarDays },
    { href: "/y4r9vt", label: "店内状況", icon: Activity },
    { href: "/v3r8nb", label: "卓管理", icon: Grid3X3 },
    { href: "/x6j2fp", label: "注文 / 精算", icon: ShoppingBag },
  ]},
  { section: "管理", items: [
    { href: "/a9k5dm", label: "顧客管理", icon: Users },
    { href: "/g8n4vr", label: "従業員管理", icon: UserPlus },
    { href: "/z5b7lc", label: "勤怠管理", icon: Clock },
    { href: "/w2f6yp", label: "締め処理", icon: Lock },
    { href: "/l4p7sf", label: "集計レポート", icon: BarChart3 },
    { href: "/n3k8xh", label: "履歴", icon: History },
  ]},
  { section: "会員施策", items: [
    { href: "/c6h2zp", label: "ランキング", icon: Trophy },
    { href: "/f9g4nd", label: "マルチケ配布", icon: Gift },
    { href: "/d7s3xl", label: "イベント", icon: CalendarDays },
    { href: "/j2m6bw", label: "POP", icon: ImageIcon },
  ]},
  { section: "設定", items: [
    { href: "/p5d7mg", label: "商品マスタ", icon: Package },
    { href: "/t5k8hy", label: "ポイントルール", icon: Sparkles },
    { href: "/e4s9jq", label: "店舗設定", icon: Settings },
    { href: "/q8v3rc", label: "監査ログ", icon: ShieldCheck },
  ]},
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-bg-white border-r border-border flex flex-col h-full">
      <div className="h-14 flex items-center px-2 border-b border-border">
        <Link href="/h7p2kx" className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0">
          <Image src="/logo-icon.png" alt="みえるくん" width={48} height={48} className="shrink-0" />
          <span className="text-[13px] font-bold text-text-primary tracking-tight whitespace-nowrap">てんぽみえるくん</span>
        </Link>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV.map((section) => (
          <div key={section.section} className="mb-1">
            <div className="px-4 pt-3 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">
                {section.section}
              </span>
            </div>
            {section.items.map((item) => {
              const active = item.href === "/a9k5dm/q7t3wc"
                ? pathname === "/a9k5dm/q7t3wc"
                : item.href === "/a9k5dm"
                  ? pathname === "/a9k5dm" || (pathname.startsWith("/a9k5dm/") && pathname !== "/a9k5dm/q7t3wc")
                  : pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 mx-2 px-3 py-[7px] rounded-[var(--radius)] text-[13px] font-medium transition-colors ${
                    active
                      ? "bg-accent-light text-accent"
                      : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                  }`}
                >
                  <Icon className="w-[16px] h-[16px]" strokeWidth={active ? 2.2 : 1.8} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-border-light flex items-center gap-2">
        <Image src="/logo-icon.png" alt="みえるくん" width={20} height={20} className="opacity-40" />
        <div className="text-[11px] text-text-tertiary">Come On Casino</div>
      </div>
    </aside>
  );
}
