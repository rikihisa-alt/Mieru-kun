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
  "/r8w3kc/h9j4dy": "注文履歴",
  "/r8w3kc": "ライブ注文",
  "/x6j2fp": "注文 / 精算",
  "/a9k5dm/q7t3wc": "顧客新規登録",
  "/a9k5dm": "顧客管理",
  "/g8n4vr": "従業員管理",
  "/z5b7lc": "勤怠管理",
  "/w2f6yp": "締め処理",
  "/l4p7sf": "集計レポート",
  "/k4r9hs": "チップフロー",
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
    <header
      className="h-14 flex items-center justify-between px-6 border-b border-border-light"
      style={{
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(14px) saturate(140%)",
        WebkitBackdropFilter: "blur(14px) saturate(140%)",
      }}
    >
      <h1 className="t-title" style={{ fontSize: 17 }}>{title}</h1>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-3 border-r border-border-light">
          <Image src="/logo-icon.png" alt="みえるくん" width={20} height={20} className="opacity-50" />
          <span className="t-caption">
            {new Date().toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-ghost btn-sm"
          title="ログアウト"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>ログアウト</span>
        </button>
      </div>
    </header>
  );
}
