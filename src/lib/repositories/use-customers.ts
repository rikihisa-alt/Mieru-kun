"use client";

// =====================================================================
// useCustomers() — 顧客一覧+CRUDフック。
// 未接続時: customerStore(tempo_customers_v1)を使う現行のlocalStorage挙動と完全に同一。
// 接続時: Supabaseから取得しRealtime購読で自動更新、opsはrepo経由(書き込みはSupabaseのみ)。
// =====================================================================

import { useCallback, useEffect, useState } from "react";
import { usePersisted } from "@/lib/persist/store";
import { customerStore, type CustomerRecord } from "@/lib/store/domain-stores";
import { isSupabaseConfigured, createClient } from "@/lib/supabase/client";
import * as customerRepo from "./customer-repo";
import type { BulkUpsertItem } from "./customer-repo";

function makeLocalId() {
  return Math.random().toString(36).slice(2, 10);
}

export interface UseCustomersResult {
  customers: CustomerRecord[];
  loading: boolean;
  createCustomer: (input: Partial<CustomerRecord> & Pick<CustomerRecord, "name">) => Promise<CustomerRecord>;
  updateCustomer: (id: string, patch: Partial<CustomerRecord>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  bulkUpsert: (items: BulkUpsertItem[]) => Promise<void>;
}

export function useCustomers(): UseCustomersResult {
  const connected = isSupabaseConfigured();

  // ---- 未接続時: 現行のlocalStorage挙動をそのまま使う ----
  const [localCustomers, setLocalCustomers] = usePersisted(customerStore);

  // ---- 接続時: Supabase state ----
  const [remoteCustomers, setRemoteCustomers] = useState<CustomerRecord[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(true);

  useEffect(() => {
    if (!connected) return;
    let active = true;
    // 初期値は useState(true) 済みなのでここでの再設定は不要(effect内での同期setState回避)。
    customerRepo
      .listCustomers()
      .then((list) => {
        if (active) setRemoteCustomers(list);
      })
      .catch(() => {
        /* 接続エラー時は空一覧のまま(画面は壊さない) */
      })
      .finally(() => {
        if (active) setRemoteLoading(false);
      });

    const supabase = createClient();
    const channel = supabase
      .channel("phase1-customers")
      .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, () => {
        customerRepo
          .listCustomers()
          .then((list) => {
            if (active) setRemoteCustomers(list);
          })
          .catch(() => {});
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [connected]);

  const createCustomer = useCallback(
    async (input: Partial<CustomerRecord> & Pick<CustomerRecord, "name">): Promise<CustomerRecord> => {
      if (!connected) {
        const c: CustomerRecord = {
          id: makeLocalId(),
          name: input.name,
          nickname: input.nickname ?? "",
          rank: input.rank ?? "regular",
          phone: input.phone ?? "",
          pledgeNo: input.pledgeNo,
          email: input.email,
          dateOfBirth: input.dateOfBirth,
          referrerName: input.referrerName,
          notes: input.notes,
          cautionText: input.cautionText,
          isBlacklisted: input.isBlacklisted,
          isHidden: input.isHidden,
          firstVisitChecked: input.firstVisitChecked,
          snsX: input.snsX,
          snsIg: input.snsIg,
          snsTikTok: input.snsTikTok,
          totalVisits: input.totalVisits ?? 0,
          totalSpent: input.totalSpent ?? 0,
          chipBalance: input.chipBalance ?? 0,
          pointBalance: input.pointBalance ?? 0,
          multikeBalance: input.multikeBalance,
          lastVisit: input.lastVisit,
          prizeCount: input.prizeCount ?? 0,
          lastPrize: input.lastPrize,
          createdAt: new Date().toISOString(),
        };
        setLocalCustomers((prev) => [c, ...prev]);
        return c;
      }
      const created = await customerRepo.createCustomer(input);
      setRemoteCustomers((prev) => [created, ...prev]);
      return created;
    },
    [connected, setLocalCustomers]
  );

  const updateCustomer = useCallback(
    async (id: string, patch: Partial<CustomerRecord>): Promise<void> => {
      if (!connected) {
        setLocalCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
        return;
      }
      const updated = await customerRepo.updateCustomer(id, patch);
      setRemoteCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)));
    },
    [connected, setLocalCustomers]
  );

  const deleteCustomer = useCallback(
    async (id: string): Promise<void> => {
      if (!connected) {
        setLocalCustomers((prev) => prev.filter((c) => c.id !== id));
        return;
      }
      await customerRepo.deleteCustomer(id);
      setRemoteCustomers((prev) => prev.filter((c) => c.id !== id));
    },
    [connected, setLocalCustomers]
  );

  const bulkUpsert = useCallback(
    async (items: BulkUpsertItem[]): Promise<void> => {
      if (!connected) {
        setLocalCustomers((prev) => {
          const next = [...prev];
          for (const item of items) {
            if (item.id) {
              const idx = next.findIndex((c) => c.id === item.id);
              if (idx !== -1) next[idx] = { ...next[idx], ...item, id: next[idx].id };
            } else {
              const c: CustomerRecord = {
                id: makeLocalId(),
                name: item.name ?? "",
                nickname: item.nickname ?? "",
                rank: item.rank ?? "regular",
                phone: item.phone ?? "",
                pledgeNo: item.pledgeNo,
                email: item.email,
                dateOfBirth: item.dateOfBirth,
                notes: item.notes,
                totalVisits: item.totalVisits ?? 0,
                totalSpent: item.totalSpent ?? 0,
                chipBalance: item.chipBalance ?? 0,
                pointBalance: item.pointBalance ?? 0,
                prizeCount: item.prizeCount ?? 0,
                createdAt: new Date().toISOString(),
              };
              next.push(c);
            }
          }
          return next;
        });
        return;
      }
      const list = await customerRepo.bulkUpsertCustomers(items);
      setRemoteCustomers(list);
    },
    [connected, setLocalCustomers]
  );

  return {
    customers: connected ? remoteCustomers : localCustomers,
    loading: connected ? remoteLoading : false,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    bulkUpsert,
  };
}
