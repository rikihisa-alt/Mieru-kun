"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Home, Clock, Grid3X3, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/staff-home", label: "ホーム", icon: Home },
  { href: "/clock", label: "出退勤", icon: Clock },
  { href: "/table-view", label: "卓確認", icon: Grid3X3 },
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
    <div className="min-h-screen bg-bg flex flex-col">
      {/* ヘッダー */}
      <header className="sticky top-0 z-30 bg-bg-white border-b border-border">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-1.5">
            <Image src="/logo-icon.png" alt="みえるくん" width={22} height={22} />
            <span className="text-[13px] font-bold text-text-primary">てんぽみえるくん</span>
          </div>
          <button onClick={handleLogout} className="p-1.5 rounded-[var(--radius)] text-text-tertiary hover:bg-bg-hover">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 pb-16 px-4 py-3">{children}</main>

      {/* ボトムナビ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-bg-white border-t border-border z-40">
        <div className="flex items-center justify-around h-14 max-w-md mx-auto">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
                  active ? "text-accent" : "text-text-tertiary"
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.2 : 1.6} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
