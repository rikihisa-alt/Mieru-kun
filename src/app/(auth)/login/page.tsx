"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link href="/" className="text-[16px] font-bold text-text-primary">てんぽみえるくん</Link>
        </div>

        <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] p-6">
          <h1 className="text-[16px] font-bold text-text-primary mb-5 text-center">ログイン</h1>

          {error && (
            <div className="mb-4 px-3 py-2 bg-status-danger-bg border border-status-danger/20 rounded-[var(--radius)] text-[12px] text-status-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-text-secondary mb-1">メールアドレス</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-text-secondary mb-1">パスワード</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={6} />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-accent text-text-inverse text-[13px] font-medium rounded-[var(--radius)] hover:bg-accent-hover transition-colors disabled:opacity-50">
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>

          <div className="mt-4">
            <button onClick={() => router.push("/dashboard")} className="w-full py-2.5 bg-bg border border-border text-[13px] font-medium text-text-secondary rounded-[var(--radius)] hover:bg-bg-hover transition-colors">
              デモモードで入る
            </button>
          </div>

          <p className="mt-4 text-center text-[12px] text-text-tertiary">
            アカウントをお持ちでない方は <Link href="/signup" className="text-accent hover:underline">新規登録</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
