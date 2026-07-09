"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import "./line.css";

const TITLE_BY_PATH: Record<string, string> = {
  "/u3j5ny": "マイページ",
  "/u3j5ny/p2x7nq": "注文・店員呼び出し",
  "/u3j5ny/y4r9vt": "店内状況",
  "/u3j5ny/k3f8qm": "来店予約",
  "/u3j5ny/d7s3xl": "スケジュール",
  "/u3j5ny/c6h2zp": "ランキング",
  "/u3j5ny/h4n6pw": "チップ残高",
  "/u3j5ny/q2s9xf": "ポイント",
  "/u3j5ny/m7k3rb": "マルチケ",
  "/u3j5ny/v5f8wz": "来店履歴",
  "/u3j5ny/b3k9wf": "保有残高",
};

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = TITLE_BY_PATH[pathname] ?? "マイページ";

  return (
    <div className="ln" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="ln-topbar">
        <Image src="/logo-icon.png" alt="みえるくん" width={22} height={22} />
        <span>{title}</span>
      </header>
      <main style={{ flex: 1 }} className="ln-safe">{children}</main>
    </div>
  );
}
