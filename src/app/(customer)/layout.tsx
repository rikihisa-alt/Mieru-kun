import { Store } from "lucide-react";
import Link from "next/link";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ヘッダー */}
      <header className="sticky top-0 z-30 bg-white border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/mypage" className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm">マイページ</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 px-4 py-4 max-w-lg mx-auto w-full">{children}</main>
    </div>
  );
}
