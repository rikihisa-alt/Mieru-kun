"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "ダッシュボード",
  "/floor": "入店管理",
  "/tables": "卓管理",
  "/orders": "注文 / 精算",
  "/customers/new": "顧客新規登録",
  "/customers": "顧客管理",
  "/staff": "従業員管理",
  "/attendance": "勤怠管理",
  "/closing": "締め処理",
  "/history": "履歴",
  "/products": "商品マスタ",
  "/settings": "店舗設定",
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const title = Object.entries(PAGE_TITLES).find(
    ([path]) => pathname === path || pathname.startsWith(path + "/")
  )?.[1] ?? "";

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="h-24 bg-bg-white border-b border-border flex items-center justify-between px-6">
      <h1 className="text-[15px] font-semibold text-text-primary">{title}</h1>
      <div className="flex items-center gap-3">
        <Image src="/logo-icon.png" alt="みえるくん" width={22} height={22} className="opacity-25" />
        <span className="text-[12px] text-text-tertiary">
          {new Date().toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}
        </span>
        <button
          onClick={handleLogout}
          className="p-1.5 rounded-[var(--radius)] text-text-tertiary hover:bg-bg-hover hover:text-text-secondary transition-colors"
          title="ログアウト"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
