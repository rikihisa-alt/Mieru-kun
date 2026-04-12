"use client";

import { toast } from "sonner";

/**
 * Toast通知ヘルパー
 * Server Actionの結果に応じて自動的にトーストを表示
 */
export function useActionToast() {
  function handleResult(result: { success?: boolean; error?: string }, successMessage?: string) {
    if (result.error) {
      toast.error(result.error);
      return false;
    }
    if (result.success && successMessage) {
      toast.success(successMessage);
    }
    return true;
  }

  return { handleResult, toast };
}
