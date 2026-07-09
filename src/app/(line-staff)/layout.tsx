"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Home, Clock, Grid3X3, LogOut, QrCode, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import "../(line-customer)/line.css";

const NAV = [
  { href: "/s6y4bp", label: "ホーム", icon: Home },
  { href: "/w6n4gk", label: "QR", icon: QrCode },
  { href: "/r7d2pm", label: "卓確認", icon: Grid3X3 },
  { href: "/t9m4kz", label: "注文", icon: ShoppingBag },
  { href: "/b8q4ft", label: "出退勤", icon: Clock },
];

export default function LineStaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="ln" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ヘッダー */}
      <header className="ln-topbar" style={{ justifyContent: "space-between" }}>
        <div className="ln-row">
          <Image src="/logo-icon.png" alt="みえるくん" width={22} height={22} />
          <span>てんぽみえるくん</span>
        </div>
        <button
          onClick={handleLogout}
          className="ln-topbar__icon-btn"
          aria-label="ログアウト"
          style={{ width: 44, height: 44 }}
        >
          <LogOut size={16} />
        </button>
      </header>

      <main style={{ flex: 1, paddingBottom: "calc(72px + env(safe-area-inset-bottom))" }}>{children}</main>

      {/* ボトムナビ */}
      <nav className="ln-tabbar">
        <div className="ln-tabbar__inner">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`ln-tabbar__item${active ? " ln-tabbar__item--active" : ""}`}
              >
                <Icon size={20} strokeWidth={active ? 2.2 : 1.6} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
