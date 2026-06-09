"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Home, Clock, Grid3X3, LogOut, QrCode } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import "../(line-customer)/line.css";

const NAV = [
  { href: "/s6y4bp", label: "ホーム", icon: Home },
  { href: "/w6n4gk", label: "QR", icon: QrCode },
  { href: "/r7d2pm", label: "卓確認", icon: Grid3X3 },
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
          className="ln-btn ln-btn--ghost ln-btn--sm"
          aria-label="ログアウト"
          style={{ padding: 6, height: 30, color: "var(--ln-text-mute)" }}
        >
          <LogOut size={16} />
        </button>
      </header>

      <main style={{ flex: 1, paddingBottom: 64 }}>{children}</main>

      {/* ボトムナビ */}
      <nav
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
          background: "var(--ln-card)",
          borderTop: "1px solid var(--ln-border)",
          boxShadow: "0 -2px 8px rgba(28, 46, 36, 0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", height: 56, maxWidth: 480, margin: "0 auto" }}>
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                  fontSize: 10, fontWeight: 500, textDecoration: "none",
                  color: active ? "var(--ln-accent-text)" : "var(--ln-text-mute)",
                  transition: "color 0.12s",
                }}
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
