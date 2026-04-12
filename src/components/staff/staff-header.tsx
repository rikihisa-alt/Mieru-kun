"use client";

import Link from "next/link";
import { Store, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface StaffHeaderProps {
  title?: string;
}

export function StaffHeader({ title }: StaffHeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-border">
      <div className="flex items-center justify-between px-4 h-14">
        <Link href="/home" className="flex items-center gap-2">
          <Store className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm">
            {title ?? "てんぽみえるくん"}
          </span>
        </Link>
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          title="ログアウト"
        >
          <LogOut className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
