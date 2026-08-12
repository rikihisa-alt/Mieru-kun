"use client";

// =====================================================================
// useInStoreVisits() — 来店中一覧+入店/退店フック。
// 未接続時: usePersistedState("v2_visits_v1", [])を使う現行のlocalStorage挙動と完全に同一
//   (退店は削除=filter、既存の tables/orders/ranking 等と同じキーを共有)。
// 接続時: Supabaseから取得、opsはrepo経由(削除しない。checked_out_at更新)。
// =====================================================================

import { useCallback, useEffect, useState } from "react";
import { usePersistedState } from "@/lib/persist/store";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { CustomerRank } from "@/lib/store/domain-stores";
import * as visitRepo from "./visit-repo";
import type { AppVisit as Visit } from "./mappers";

export type { Visit };

export interface CheckInParams {
  customerId: string | null;
  name: string;
  rank: CustomerRank;
}

export interface UseInStoreVisitsResult {
  visits: Visit[];
  loading: boolean;
  checkIn: (input: CheckInParams) => Promise<Visit>;
  checkOut: (visitId: string) => Promise<void>;
}

function makeLocalVisitId() {
  return `v${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function useInStoreVisits(): UseInStoreVisitsResult {
  const connected = isSupabaseConfigured();

  // ---- 未接続時: 現行のlocalStorage挙動をそのまま使う ----
  const [localVisits, setLocalVisits] = usePersistedState<Visit[]>("v2_visits_v1", []);

  // ---- 接続時: Supabase state ----
  const [remoteVisits, setRemoteVisits] = useState<Visit[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(true);

  useEffect(() => {
    if (!connected) return;
    let active = true;
    // 初期値は useState(true) 済みなのでここでの再設定は不要(effect内での同期setState回避)。
    visitRepo
      .listInStore()
      .then((list) => {
        if (active) setRemoteVisits(list);
      })
      .catch(() => {
        /* 接続エラー時は空一覧のまま(画面は壊さない) */
      })
      .finally(() => {
        if (active) setRemoteLoading(false);
      });
    return () => {
      active = false;
    };
  }, [connected]);

  const checkIn = useCallback(
    async (input: CheckInParams): Promise<Visit> => {
      if (!connected) {
        const v: Visit = {
          id: makeLocalVisitId(),
          customerId: input.customerId,
          name: input.name,
          rank: input.rank,
          checkedInAt: new Date().toISOString(),
        };
        setLocalVisits((prev) => [v, ...prev]);
        return v;
      }
      // ※ ゲスト来店(customerId=null)のランクはDB(visits)に保持列がないため、
      //   再読込後は一覧上 "Regular" 表示にフォールバックする(Phase1の既知の制約)。
      const created = await visitRepo.checkIn({ customerId: input.customerId, name: input.name });
      const list = await visitRepo.listInStore();
      setRemoteVisits(list);
      return created;
    },
    [connected, setLocalVisits]
  );

  const checkOut = useCallback(
    async (visitId: string): Promise<void> => {
      if (!connected) {
        setLocalVisits((prev) => prev.filter((v) => v.id !== visitId));
        return;
      }
      await visitRepo.checkOut(visitId);
      const list = await visitRepo.listInStore();
      setRemoteVisits(list);
    },
    [connected, setLocalVisits]
  );

  return {
    visits: connected ? remoteVisits : localVisits,
    loading: connected ? remoteLoading : false,
    checkIn,
    checkOut,
  };
}
