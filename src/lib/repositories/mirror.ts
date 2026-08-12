"use client";

// =====================================================================
// Supabase → localStorage ミラー更新ヘルパー。
//
// Supabase接続時、書き込みはSupabaseのみを正(SoT)とする。ただし customers/orders/tables/
// ranking 等の未移行ページは今も customerStore(tempo_customers_v1) / v2_visits_v1 キーを
// 直接読むため、Supabase書き込み成功後にその内容でlocalStorageを上書きし、
// 「派生キャッシュ」として整合させる。UIから直接localStorageへは書かない。
// =====================================================================

import { createPersistedStore } from "@/lib/persist/store";
import { customerStore, type CustomerRecord } from "@/lib/store/domain-stores";
import type { AppVisit } from "./mappers";

/**
 * v2_visits_v1 書き込み用ストア。checkin/tables/orders等の各ページは
 * usePersistedState("v2_visits_v1", []) で同じキーを購読しており、BroadcastChannel +
 * storageイベントで同期されるため、このモジュール専用のストアインスタンスからの set() でも
 * 他ページへ正しく伝播する。
 */
export const visitsMirrorStore = createPersistedStore<AppVisit[]>("v2_visits_v1", []);

/** Supabase由来の顧客一覧で customerStore(tempo_customers_v1) を上書きする。 */
export function mirrorCustomers(list: CustomerRecord[]) {
  customerStore.set(() => list);
}

/** Supabase由来の在店中一覧で v2_visits_v1 を上書きする。 */
export function mirrorVisits(list: AppVisit[]) {
  visitsMirrorStore.set(() => list);
}
