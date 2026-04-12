"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Clock,
  Users,
  LogIn,
  ShoppingCart,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const mainNavItems = [
  { href: "/home", label: "ホーム", icon: Home },
  { href: "/attendance", label: "出退勤", icon: Clock },
  { href: "/checkin", label: "入店", icon: LogIn },
  { href: "/orders", label: "注文", icon: ShoppingCart },
  { href: "/customers", label: "顧客", icon: Users },
];

const moreNavItems = [
  { href: "/checkout", label: "退店/精算" },
  { href: "/prizes", label: "プライズ" },
  { href: "/coupons", label: "クーポン" },
  { href: "/staff-events", label: "イベント" },
  { href: "/staff-announcements", label: "お知らせ" },
  { href: "/dashboard", label: "管理画面" },
];

export function BottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {/* More メニュー展開 */}
      {showMore && (
        <div
          className="fixed inset-0 z-30 bg-black/20"
          onClick={() => setShowMore(false)}
        >
          <div
            className="absolute bottom-16 left-0 right-0 bg-white border-t border-border rounded-t-xl p-3 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-3 gap-2">
              {moreNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMore(false)}
                  className="text-center py-3 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* メインナビ */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 w-full h-full text-xs transition-colors",
                  isActive ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setShowMore(!showMore)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 w-full h-full text-xs transition-colors",
              showMore ? "text-primary font-medium" : "text-muted-foreground"
            )}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span>その他</span>
          </button>
        </div>
      </nav>
    </>
  );
}
