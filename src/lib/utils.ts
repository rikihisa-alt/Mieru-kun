import { clsx, type ClassValue } from "clsx";

/** Tailwind class merge utility */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** 金額フォーマット (例: ¥1,200) */
export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

/** 日付フォーマット (例: 2024/04/12) */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/** 日時フォーマット (例: 2024/04/12 14:30) */
export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 時刻フォーマット (例: 14:30) */
export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 分 → "○時間○分" */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

/** 今日の日付文字列 (YYYY-MM-DD) */
export function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

/** ランクの日本語ラベル */
export function rankLabel(rank: string): string {
  const map: Record<string, string> = {
    regular: "レギュラー",
    silver: "シルバー",
    gold: "ゴールド",
    vip: "VIP",
  };
  return map[rank] ?? rank;
}

/** ランクの色クラス */
export function rankColor(rank: string): string {
  const map: Record<string, string> = {
    regular: "bg-gray-100 text-gray-700",
    silver: "bg-slate-200 text-slate-700",
    gold: "bg-amber-100 text-amber-700",
    vip: "bg-purple-100 text-purple-700",
  };
  return map[rank] ?? "bg-gray-100 text-gray-700";
}

/** ステータスの日本語ラベル */
export function visitStatusLabel(status: string): string {
  const map: Record<string, string> = {
    active: "来店中",
    settled: "精算済",
    cancelled: "キャンセル",
  };
  return map[status] ?? status;
}

/** ステータスの色クラス */
export function visitStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    settled: "bg-blue-100 text-blue-700",
    cancelled: "bg-gray-100 text-gray-500",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
}

/** カテゴリの日本語ラベル */
export function categoryLabel(category: string): string {
  const map: Record<string, string> = {
    drink: "ドリンク",
    food: "フード",
    chip: "チップ",
    other: "その他",
  };
  return map[category] ?? category;
}

/** MVPではstore_idを固定で返す */
export const DEMO_STORE_ID = "00000000-0000-0000-0000-000000000001";
