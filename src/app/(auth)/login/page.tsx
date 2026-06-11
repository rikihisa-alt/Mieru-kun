"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError("メールアドレスまたはパスワードが正しくありません"); setLoading(false); return; }
    } catch { /* demo */ }
    router.push("/v2");
  }

  function handleDemo() {
    // デモモードcookieを設定してからダッシュボードへ
    document.cookie = "demo_mode=true; path=/; max-age=86400; SameSite=Lax";
    window.location.href = "/v2";
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <Image src="/logo-icon.png" alt="みえるくん" width={80} height={80} />
            <span className="text-[22px] font-bold text-text-primary tracking-tight">てんぽみえるくん</span>
          </Link>
        </div>

        <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] p-8 shadow-sm">
          <h1 className="text-[20px] font-bold text-text-primary mb-6 text-center">ログイン</h1>

          {error && (
            <div className="mb-5 px-4 py-3 bg-status-danger-bg border border-status-danger/20 rounded-[var(--radius)] text-[13px] text-status-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-1.5">メールアドレス</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ padding: "10px 12px", fontSize: "14px" }} />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-1.5">パスワード</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={6} style={{ padding: "10px 12px", fontSize: "14px" }} />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-accent text-white text-[15px] font-medium rounded-[var(--radius)] hover:bg-accent-hover transition-colors disabled:opacity-50">
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>

          <div className="mt-4">
            <button onClick={handleDemo} className="w-full py-3 bg-bg border border-border text-[14px] font-medium text-text-secondary rounded-[var(--radius)] hover:bg-bg-hover transition-colors">
              デモモードで入る
            </button>
          </div>

          <p className="mt-6 text-center text-[13px] text-text-tertiary">
            アカウントをお持ちでない方は <Link href="/signup" className="text-accent font-medium hover:underline">新規登録</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
