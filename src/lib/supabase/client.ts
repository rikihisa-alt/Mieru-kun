import { createBrowserClient } from "@supabase/ssr";

// 公開可能キー。新方式の Publishable Key (sb_publishable_...) を優先し、
// 互換のため旧 ANON_KEY もフォールバックで参照する。secret/service_role は使わない。
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "placeholder-key";

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey);
}

/**
 * Supabaseが実接続可能か(クライアント/ブラウザ側の判定)。
 * URL/KEYが実値で、URLがplaceholderを含まない場合のみ true。
 * server.ts の isSupabaseConfigured と同等ロジック(用途別に複製)。
 */
export function isSupabaseConfigured(): boolean {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    key &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
  );
}
