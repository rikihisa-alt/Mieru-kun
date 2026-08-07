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
