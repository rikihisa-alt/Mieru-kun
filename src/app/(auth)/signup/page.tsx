"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Step = "account" | "store";

export default function SignupPage() {
  const router = useRouter();

  // ステップ管理
  const [step, setStep] = useState<Step>("account");

  // アカウント
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 店舗初期設定
  const [storeName, setStoreName] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAccountSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        // Supabase未接続でもステップは進める（デモ/初期設定フロー）
        console.warn("signUp failed, continuing to store setup", error.message);
      }
    } catch {
      // ignore
    }

    setLoading(false);
    setStep("store");
  }

  async function handleStoreSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!storeName.trim()) {
      setError("店舗名は必須です");
      return;
    }

    setLoading(true);

    // 実DB連携は後続タスク。今は localStorage に初期値を持たせてダッシュボードへ
    try {
      const data = {
        storeName: storeName.trim(),
        storePhone: storePhone.trim(),
        storeAddress: storeAddress.trim(),
        openTime: openTime.trim(),
        closeTime: closeTime.trim(),
      };
      localStorage.setItem("store_initial_setup", JSON.stringify(data));
    } catch {
      // ignore
    }

    router.push("/h7p2kx");
    router.refresh();
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

        {/* ステップインジケータ */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <StepDot active={step === "account"} done={step === "store"} label="1" />
          <div className={`w-10 h-px ${step === "store" ? "bg-accent" : "bg-border"}`} />
          <StepDot active={step === "store"} done={false} label="2" />
        </div>

        <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] p-8 shadow-sm">
          {step === "account" ? (
            <>
              <h1 className="text-[20px] font-bold text-text-primary mb-2 text-center">新規登録</h1>
              <p className="text-[13px] text-text-tertiary text-center mb-6">Step 1 / 2 — アカウント作成</p>

              {error && (
                <div className="mb-5 px-4 py-3 bg-status-danger-bg border border-status-danger/20 rounded-[var(--radius)] text-[13px] text-status-danger">
                  {error}
                </div>
              )}

              <form onSubmit={handleAccountSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-[13px] font-medium text-text-secondary mb-1.5">メールアドレス</label>
                  <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={{ padding: "10px 12px", fontSize: "14px" }} />
                </div>
                <div>
                  <label htmlFor="password" className="block text-[13px] font-medium text-text-secondary mb-1.5">パスワード</label>
                  <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="6文字以上" style={{ padding: "10px 12px", fontSize: "14px" }} />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-[13px] font-medium text-text-secondary mb-1.5">パスワード（確認）</label>
                  <input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} placeholder="もう一度入力" style={{ padding: "10px 12px", fontSize: "14px" }} />
                </div>
                <button type="submit" disabled={loading} className="w-full py-3 bg-accent text-white text-[15px] font-medium rounded-[var(--radius)] hover:bg-accent-hover transition-colors disabled:opacity-50">
                  {loading ? "作成中..." : "次へ：店舗情報を入力"}
                </button>
              </form>

              <p className="mt-6 text-center text-[13px] text-text-tertiary">
                すでにアカウントをお持ちの方は <Link href="/login" className="text-accent font-medium hover:underline">ログイン</Link>
              </p>
            </>
          ) : (
            <>
              <button onClick={() => { setStep("account"); setError(""); }} className="flex items-center gap-1 text-[12px] text-text-tertiary hover:text-text-secondary mb-3">
                <ArrowLeft className="w-3.5 h-3.5" />戻る
              </button>
              <h1 className="text-[20px] font-bold text-text-primary mb-2 text-center">店舗初期設定</h1>
              <p className="text-[13px] text-text-tertiary text-center mb-6">Step 2 / 2 — 店舗情報（店舗名以外は任意）</p>

              {error && (
                <div className="mb-5 px-4 py-3 bg-status-danger-bg border border-status-danger/20 rounded-[var(--radius)] text-[13px] text-status-danger">
                  {error}
                </div>
              )}

              <form onSubmit={handleStoreSubmit} className="space-y-4">
                <div>
                  <label htmlFor="storeName" className="block text-[13px] font-medium text-text-secondary mb-1.5">
                    店舗名 <span className="text-status-danger">*</span>
                  </label>
                  <input id="storeName" type="text" value={storeName} onChange={e => setStoreName(e.target.value)} required placeholder="Come On Casino 本店" style={{ padding: "10px 12px", fontSize: "14px" }} />
                </div>
                <div>
                  <label htmlFor="storePhone" className="block text-[13px] font-medium text-text-secondary mb-1.5">電話番号 <span className="text-[11px] text-text-tertiary font-normal">(任意)</span></label>
                  <input id="storePhone" type="tel" value={storePhone} onChange={e => setStorePhone(e.target.value)} placeholder="03-1234-5678" style={{ padding: "10px 12px", fontSize: "14px" }} />
                </div>
                <div>
                  <label htmlFor="storeAddress" className="block text-[13px] font-medium text-text-secondary mb-1.5">住所 <span className="text-[11px] text-text-tertiary font-normal">(任意)</span></label>
                  <input id="storeAddress" type="text" value={storeAddress} onChange={e => setStoreAddress(e.target.value)} placeholder="東京都新宿区..." style={{ padding: "10px 12px", fontSize: "14px" }} />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-text-secondary mb-1.5">営業時間 <span className="text-[11px] text-text-tertiary font-normal">(任意)</span></label>
                  <div className="flex items-center gap-2">
                    <input type="time" value={openTime} onChange={e => setOpenTime(e.target.value)} style={{ padding: "10px 12px", fontSize: "14px" }} />
                    <span className="text-text-tertiary">〜</span>
                    <input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} style={{ padding: "10px 12px", fontSize: "14px" }} />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full py-3 bg-accent text-white text-[15px] font-medium rounded-[var(--radius)] hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? "保存中..." : (<><Check className="w-4 h-4" />登録を完了してダッシュボードへ</>)}
                </button>
                <p className="text-center text-[12px] text-text-tertiary">
                  入力した情報は後から店舗設定で変更できます
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold ${
      done ? "bg-accent text-white" : active ? "bg-accent text-white" : "bg-bg border border-border text-text-tertiary"
    }`}>
      {done ? <Check className="w-3.5 h-3.5" /> : label}
    </div>
  );
}
