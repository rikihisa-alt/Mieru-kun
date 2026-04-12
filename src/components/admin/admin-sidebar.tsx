"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Store,
  LayoutDashboard,
  BarChart3,
  Users,
  ClipboardCheck,
  Package,
  Settings,
  LogOut,
  Smartphone,
  Warehouse,
  UserCog,
  CalendarDays,
  Bell,
  FileText,
  Briefcase,
  Download,
  BellRing,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "営業",
    items: [
      { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
      { href: "/sales", label: "売上分析", icon: BarChart3 },
      { href: "/customer-analysis", label: "顧客分析", icon: Users },
      { href: "/closing", label: "日次締め", icon: ClipboardCheck },
      { href: "/closing/history", label: "締め履歴", icon: ClipboardCheck },
    ],
  },
  {
    title: "管理",
    items: [
      { href: "/products", label: "商品管理", icon: Package },
      { href: "/inventory", label: "在庫管理", icon: Warehouse },
      { href: "/staff-management", label: "スタッフ管理", icon: UserCog },
      { href: "/admin-events", label: "イベント管理", icon: CalendarDays },
      { href: "/admin-announcements", label: "お知らせ管理", icon: Bell },
    ],
  },
  {
    title: "分析",
    items: [
      { href: "/hr-analysis", label: "人件費分析", icon: Briefcase },
      { href: "/audit-logs", label: "監査ログ", icon: FileText },
      { href: "/export", label: "データ出力", icon: Download },
    ],
  },
  {
    title: "設定",
    items: [
      { href: "/notifications", label: "通知設定", icon: BellRing },
      { href: "/settings", label: "設定", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-60 bg-white border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Store className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg">てんぽみえるくん</span>
        </Link>
        <p className="text-xs text-muted-foreground mt-1">管理画面</p>
      </div>

      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (pathname.startsWith(item.href + "/") &&
                    item.href !== "/closing");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 space-y-1 border-t border-border">
        <Link
          href="/home"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Smartphone className="w-5 h-5" />
          スタッフ画面へ
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          ログアウト
        </button>
      </div>
    </aside>
  );
}
