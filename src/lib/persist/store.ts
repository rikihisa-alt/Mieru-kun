"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

// =================================================================
// 汎用 永続ストア
// localStorage + BroadcastChannel でクロスタブ同期。
// React は useSyncExternalStore を介して購読 → 全画面で自動反映。
// =================================================================

type Listener = () => void;

interface PersistStore<T> {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (l: Listener) => () => void;
  reset: () => void;
}

const channels = new Map<string, BroadcastChannel>();

export function createPersistedStore<T>(key: string, defaultValue: T): PersistStore<T> {
  let state: T = defaultValue;
  const listeners = new Set<Listener>();
  let loaded = false;
  let channel: BroadcastChannel | null = null;

  function ensureLoaded() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = localStorage.getItem(key);
      if (raw) state = JSON.parse(raw) as T;
    } catch { /* */ }
    try {
      channel = new BroadcastChannel(`store:${key}`);
      channels.set(key, channel);
      channel.onmessage = (e) => {
        if (e.data && "value" in e.data) {
          state = e.data.value as T;
          listeners.forEach((l) => l());
        }
      };
    } catch { /* old browsers */ }
    // storage event(別タブ)
    window.addEventListener("storage", (e) => {
      if (e.key !== key || !e.newValue) return;
      try {
        state = JSON.parse(e.newValue) as T;
        listeners.forEach((l) => l());
      } catch { /* */ }
    });
  }

  function persist(value: T) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* */ }
    try { channel?.postMessage({ value }); } catch { /* */ }
  }

  return {
    get() {
      ensureLoaded();
      return state;
    },
    set(next) {
      ensureLoaded();
      const value = typeof next === "function" ? (next as (p: T) => T)(state) : next;
      state = value;
      persist(value);
      listeners.forEach((l) => l());
    },
    subscribe(l) {
      ensureLoaded();
      listeners.add(l);
      return () => { listeners.delete(l); };
    },
    reset() {
      this.set(defaultValue);
    },
  };
}

// React Hook
export function usePersisted<T>(store: PersistStore<T>): [T, (next: T | ((prev: T) => T)) => void] {
  // SSR safe: server uses default
  const value = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.get(),
    () => store.get(),
  );
  return [value, store.set.bind(store)];
}

// hydrate保護: クライアントマウントまで初期値を返す
export function usePersistedHydrated<T>(store: PersistStore<T>): [T, boolean, (next: T | ((prev: T) => T)) => void] {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [value, set] = usePersisted(store);
  return [value, mounted, set];
}

// useState の永続化版 (キー単位でストアを1つだけ作成しメモリで共有)
const localStores = new Map<string, PersistStore<unknown>>();
export function usePersistedState<T>(key: string, initial: T): [T, (next: T | ((prev: T) => T)) => void] {
  let store = localStores.get(key) as PersistStore<T> | undefined;
  if (!store) {
    store = createPersistedStore<T>(key, initial);
    localStores.set(key, store as PersistStore<unknown>);
  }
  return usePersisted(store);
}
