"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const PAGE_TITLES: Record<string, string> = {
  "/h7p2kx": "ダッシュボード",
  "/m4w9sq": "入店管理",
  "/k3f8qm": "来店予約",
  "/y4r9vt": "店内状況",
  "/v3r8nb": "卓管理",
  "/x6j2fp": "注文 / 精算",
  "/a9k5dm/q7t3wc": "顧客新規登録",
  "/a9k5dm": "顧客管理",
  "/g8n4vr": "従業員管理",
  "/z5b7lc": "勤怠管理",
  "/w2f6yp": "締め処理",
  "/l4p7sf": "集計レポート",
  "/n3k8xh": "履歴",
  "/c6h2zp": "ランキング",
  "/f9g4nd": "マルチケ配布",
  "/d7s3xl": "イベント管理",
  "/j2m6bw": "POP管理",
  "/p5d7mg": "商品マスタ",
  "/t5k8hy": "ポイントルール",
  "/e4s9jq": "店舗設定",
  "/q8v3rc": "監査ログ",
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
    <header className="h-14 bg-bg-white border-b border-border flex items-center justify-between px-6">
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
