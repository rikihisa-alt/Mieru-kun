"use client";

import { useState, useEffect } from "react";

/**
 * 入力値のデバウンスフック
 * 検索入力等でAPI呼び出しを間引くのに使用
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
