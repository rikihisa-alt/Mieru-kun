#!/usr/bin/env node
// =====================================================================
// Phase1 (stores / customers / visits) 動作確認スクリプト。
// .env.local から Supabase URL + PUBLISHABLE_KEY を読み、DEV_STORE の customers に対し
//   新規insert → select → update → visit insert(checkIn) → checked_out_at更新(checkOut。削除しない)
//   → history select
// を一通り実行して結果を出力する。マイグレーション適用後に通る想定。
// 鍵の値はログに出さない。
//
// 使い方: node scripts/verify-phase1.mjs
// =====================================================================

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

// ------------------------------------------------------------------
// .env.local を素朴にパース(dotenv非依存。KEY=VALUE 形式、# コメント/空行は無視)
// ------------------------------------------------------------------
function loadEnvLocal() {
  const envPath = path.join(repoRoot, ".env.local");
  if (!existsSync(envPath)) {
    console.error(`✗ .env.local が見つかりません: ${envPath}`);
    process.exit(1);
  }
  const text = readFileSync(envPath, "utf-8");
  const env = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const DEV_STORE_ID = "00000000-0000-0000-0000-0000000000d5";

async function main() {
  const env = loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes("placeholder")) {
    console.error("✗ NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY が未設定です(.env.local)。");
    process.exit(1);
  }
  console.log(`Supabase URL: ${url.replace(/\/\/.*@/, "//***@")}`); // 鍵はログに出さない
  console.log(`DEV_STORE_ID: ${DEV_STORE_ID}`);
  console.log("");

  const supabase = createClient(url, key);
  let ok = true;
  const step = async (label, fn) => {
    try {
      const result = await fn();
      console.log(`✓ ${label}`);
      return result;
    } catch (err) {
      ok = false;
      console.error(`✗ ${label}: ${err?.message ?? err}`);
      throw err;
    }
  };

  try {
    // 1. customers: insert
    const created = await step("customers insert", async () => {
      const { data, error } = await supabase
        .from("customers")
        .insert({
          store_id: DEV_STORE_ID,
          name: `verify-phase1 テスト客 ${Date.now()}`,
          nickname: "検証太郎",
          rank: "regular",
          phone: "090-0000-0000",
        })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    });

    // 2. customers: select
    await step("customers select", async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", created.id)
        .eq("store_id", DEV_STORE_ID)
        .single();
      if (error) throw error;
      if (data.id !== created.id) throw new Error("selectしたidが一致しません");
      return data;
    });

    // 3. customers: update
    await step("customers update", async () => {
      const { data, error } = await supabase
        .from("customers")
        .update({ notes: "verify-phase1 による更新" })
        .eq("id", created.id)
        .eq("store_id", DEV_STORE_ID)
        .select("*")
        .single();
      if (error) throw error;
      if (data.notes !== "verify-phase1 による更新") throw new Error("updateが反映されていません");
      return data;
    });

    // 4. visits: insert (checkIn)
    const visit = await step("visits insert (checkIn)", async () => {
      const { data, error } = await supabase
        .from("visits")
        .insert({
          store_id: DEV_STORE_ID,
          customer_id: created.id,
          status: "in_store",
          source: "staff",
        })
        .select("*")
        .single();
      if (error) throw error;
      if (data.checked_out_at !== null) throw new Error("checkIn直後にchecked_out_atがnullではありません");
      return data;
    });

    // 5. visits: checked_out_at 更新 (checkOut。削除しない)
    await step("visits update checked_out_at (checkOut, 削除しない)", async () => {
      const { data, error } = await supabase
        .from("visits")
        .update({ checked_out_at: new Date().toISOString(), status: "left" })
        .eq("id", visit.id)
        .eq("store_id", DEV_STORE_ID)
        .select("*")
        .single();
      if (error) throw error;
      if (!data.checked_out_at) throw new Error("checked_out_atが更新されていません");
      if (data.status !== "left") throw new Error("statusがleftになっていません");
      return data;
    });

    // 6. visits: history select (削除されておらず残っていることを確認)
    await step("visits history select (削除されていないことの確認)", async () => {
      const { data, error } = await supabase
        .from("visits")
        .select("*")
        .eq("store_id", DEV_STORE_ID)
        .eq("customer_id", created.id)
        .order("checked_in_at", { ascending: false });
      if (error) throw error;
      if (!data.some((v) => v.id === visit.id)) throw new Error("checkOut後のvisitが履歴から消えています(削除されてしまっている)");
      return data;
    });

    // 後片付け: このスクリプトが作成したテスト客・来店記録を削除
    await step("後片付け(テストデータ削除)", async () => {
      const { error: e1 } = await supabase.from("visits").delete().eq("id", visit.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("customers").delete().eq("id", created.id);
      if (e2) throw e2;
    });

    console.log("");
    console.log(ok ? "全ステップ成功。" : "一部失敗しました。");
    process.exit(ok ? 0 : 1);
  } catch {
    console.log("");
    console.log("途中で失敗しました。マイグレーション(supabase/migrations/phase1_stores_customers_visits.sql)が適用済みか確認してください。");
    process.exit(1);
  }
}

main();
