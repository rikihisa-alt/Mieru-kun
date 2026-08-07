"use client";

// =================================================================
// 店舗基本情報 アクセサ (Single Source of Truth)
//
// 現状: localStorage 永続ストア (settingsStore / キー tempo_settings_v1) を
//       そのまま参照する薄いラッパー。
// 将来: Supabase (stores / store_settings テーブル) へ移行する際は、
//       このファイルの中身だけを差し替える (fetch/キャッシュ等に置換)。
//       呼び出し側 (useStoreSettings / getStoreSettings / DEFAULT_STORE_NAME
//       を使っているコンポーネント) は無修正で動作する想定。
// =================================================================

import { usePersisted } from "@/lib/persist/store";
import { settingsStore, DEFAULT_SETTINGS, type StoreSettings } from "@/lib/store/domain-stores";

export type { StoreSettings };

/** 店舗設定を購読する React Hook。値が変わると再レンダリングされる。 */
export function useStoreSettings(): StoreSettings {
  const [settings] = usePersisted(settingsStore);
  return settings;
}

/** 店舗設定を1回だけ取得する (非React / イベントハンドラ内などで使用)。 */
export function getStoreSettings(): StoreSettings {
  return settingsStore.get();
}

/**
 * 店舗名が未設定のときに使うフォールバック文字列。
 * DEFAULT_SETTINGS.storeName (既定値) を re-export したもので、
 * 現在の保存値ではなく常に固定の既定文字列を返す。
 * 旧: pdf.ts / orders/page.tsx 等に "Come On Casino" が個別にハードコードされていたものを集約。
 */
export const DEFAULT_STORE_NAME: StoreSettings["storeName"] = DEFAULT_SETTINGS.storeName;
