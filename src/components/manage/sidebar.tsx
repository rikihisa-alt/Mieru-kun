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
} from "lucide-react";

const NAV = [
  { section: "運営", items: [
    { href: "/dashboard", label: "ダッシュボード", icon: LayoutGrid },
    { href: "/floor", label: "入店管理", icon: DoorOpen },
    { href: "/tables", label: "卓管理", icon: Grid3X3 },
    { href: "/orders", label: "注文 / 精算", icon: ShoppingBag },
  ]},
  { section: "管理", items: [
    { href: "/customers", label: "顧客管理", icon: Users },
    { href: "/staff", label: "従業員管理", icon: UserPlus },
    { href: "/attendance", label: "勤怠管理", icon: Clock },
    { href: "/closing", label: "締め処理", icon: Lock },
    { href: "/history", label: "履歴", icon: History },
  ]},
  { section: "設定", items: [
    { href: "/products", label: "商品マスタ", icon: Package },
    { href: "/settings", label: "店舗設定", icon: Settings },
  ]},
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-bg-white border-r border-border flex flex-col h-full">
      <div className="h-16 flex items-center px-3 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0">
          <Image src="/logo-icon.png" alt="みえるくん" width={44} height={44} className="shrink-0" />
          <span className="text-[14px] font-bold text-text-primary tracking-tight whitespace-nowrap">てんぽみえるくん</span>
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
              // customers/new は customers とは別の完全一致で判定
              const active = item.href === "/customers/new"
                ? pathname === "/customers/new"
                : item.href === "/customers"
                  ? pathname === "/customers" || (pathname.startsWith("/customers/") && pathname !== "/customers/new")
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
