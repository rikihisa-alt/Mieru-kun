"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError("登録に失敗しました。もう一度お試しください。");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <Image src="/logo-icon.png" alt="みえるくん" width={48} height={48} />
            <span className="text-[16px] font-bold text-text-primary">てんぽみえるくん</span>
          </Link>
        </div>

        <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] p-6">
          <h1 className="text-[16px] font-bold text-text-primary mb-5 text-center">新規登録</h1>

          {error && (
            <div className="mb-4 px-3 py-2 bg-status-danger-bg border border-status-danger/20 rounded-[var(--radius)] text-[12px] text-status-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-[12px] font-medium text-text-secondary mb-1">メールアドレス</label>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor="password" className="block text-[12px] font-medium text-text-secondary mb-1">パスワード</label>
              <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="6文字以上" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-[12px] font-medium text-text-secondary mb-1">パスワード（確認）</label>
              <input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} placeholder="もう一度入力" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-accent text-white text-[13px] font-medium rounded-[var(--radius)] hover:bg-accent-hover transition-colors disabled:opacity-50">
              {loading ? "登録中..." : "アカウントを作成"}
            </button>
          </form>

          <p className="mt-4 text-center text-[12px] text-text-tertiary">
            すでにアカウントをお持ちの方は <Link href="/login" className="text-accent hover:underline">ログイン</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
