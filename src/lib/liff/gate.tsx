"use client";

import { useEffect, useState } from "react";

export interface LiffSession {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

const KEY = "liff_session_v1";

export function getSession(): LiffSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY) ?? localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
export function setSession(s: LiffSession) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch { /* */ }
}

// デモモード判定: 本番環境変数 NEXT_PUBLIC_LIFF_ID が無ければデモ
function isDemoMode(): boolean {
  if (typeof window === "undefined") return true;
  return !process.env.NEXT_PUBLIC_LIFF_ID;
}

// デモ用ユーザー(LIFF未接続時)
const DEMO_USERS: LiffSession[] = [
  { userId: "U_demo_001", displayName: "田中 太郎" },
  { userId: "U_demo_002", displayName: "鈴木 花子" },
  { userId: "U_demo_003", displayName: "佐藤 健一" },
];

function pickDemoUser(): LiffSession {
  return DEMO_USERS[Math.floor(Math.random() * DEMO_USERS.length)];
}

/**
 * LIFFゲート: LINE経由認証を要求するラッパー
 * - 本番: liff.init → liff.isLoggedIn → liff.getProfile
 * - デモ: 自動的にダミーセッションを発行
 *
 * 実LIFF接続時は init() の中身を以下に差し替え:
 *   await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
 *   if (!liff.isLoggedIn()) { liff.login(); return; }
 *   const profile = await liff.getProfile();
 */
export function LiffGate({ children }: { children: (s: LiffSession) => React.ReactNode }) {
  const [session, setSessionState] = useState<LiffSession | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "denied">("loading");

  useEffect(() => {
    (async () => {
      const existing = getSession();
      if (existing) {
        setSessionState(existing);
        setStatus("ready");
        return;
      }
      if (isDemoMode()) {
        const s = pickDemoUser();
        setSession(s);
        setSessionState(s);
        setStatus("ready");
        return;
      }
      // 本番: LIFFを呼び出す(雛形)
      // try {
      //   const liff = (await import("@line/liff")).default;
      //   await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
      //   if (!liff.isLoggedIn()) { liff.login(); return; }
      //   const profile = await liff.getProfile();
      //   const s: LiffSession = { userId: profile.userId, displayName: profile.displayName, pictureUrl: profile.pictureUrl };
      //   setSession(s); setSessionState(s); setStatus("ready");
      // } catch (e) {
      //   setStatus("denied");
      // }
      setStatus("denied");
    })();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (status === "denied" || !session) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <p className="text-[14px] font-semibold text-text-primary">LINE経由でアクセスしてください</p>
        <p className="text-[12px] text-text-tertiary mt-2 leading-[1.7]">
          このページは店舗のLINE公式アカウント<br />リッチメニューからのみ開けます。
        </p>
      </div>
    );
  }
  return <>{children(session)}</>;
}
