import type { MenuCategory } from "./types";

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  kind: "drink" | "food";
  hotIce?: boolean;        // HOT/ICE 切替
  ice?: boolean;           // 氷あり/なし
  straw?: boolean;         // ストロー
  chopsticks?: boolean;    // 箸
  plate?: boolean;         // 取り皿
  sauceSeparate?: boolean; // ソース別添え
}

export const MENU: MenuItem[] = [
  // ===== 通常ドリンク =====
  { id: "d1", name: "コーラ", category: "regular", kind: "drink", ice: true, straw: true },
  { id: "d2", name: "ジンジャーエール", category: "regular", kind: "drink", ice: true, straw: true },
  { id: "d3", name: "アイスコーヒー", category: "regular", kind: "drink", ice: true, straw: true },
  { id: "d4", name: "オレンジジュース", category: "regular", kind: "drink", ice: true, straw: true },
  { id: "d5", name: "ウーロン茶", category: "regular", kind: "drink", ice: true },

  // ===== 飲み放題 =====
  { id: "d10", name: "ホットコーヒー", category: "tabehoudai", kind: "drink", hotIce: true },
  { id: "d11", name: "緑茶", category: "tabehoudai", kind: "drink", hotIce: true },
  { id: "d12", name: "ミルク", category: "tabehoudai", kind: "drink", hotIce: true },
  { id: "d13", name: "炭酸水", category: "tabehoudai", kind: "drink", ice: true, straw: true },

  // ===== プレミアム =====
  { id: "d20", name: "ハイボール", category: "premium", kind: "drink", ice: true },
  { id: "d21", name: "カフェラテ", category: "premium", kind: "drink", hotIce: true },
  { id: "d22", name: "グラスワイン(赤)", category: "premium", kind: "drink" },
  { id: "d23", name: "グラスワイン(白)", category: "premium", kind: "drink" },
  { id: "d24", name: "シャンパン", category: "premium", kind: "drink" },

  // ===== フード =====
  { id: "f1", name: "フライドポテト", category: "food", kind: "food", chopsticks: true, plate: true, sauceSeparate: true },
  { id: "f2", name: "唐揚げ", category: "food", kind: "food", chopsticks: true, plate: true, sauceSeparate: true },
  { id: "f3", name: "枝豆", category: "food", kind: "food", plate: true },
  { id: "f4", name: "ビーフカレー", category: "food", kind: "food", plate: true },
  { id: "f5", name: "マルゲリータピザ", category: "food", kind: "food", plate: true },
  { id: "f6", name: "軽食セット", category: "food", kind: "food", chopsticks: true, plate: true },
  { id: "f7", name: "ナチョス", category: "food", kind: "food", plate: true, sauceSeparate: true },
];

export const DRINK_CATEGORY_LABEL: Record<Exclude<MenuCategory, "food">, string> = {
  regular: "通常",
  tabehoudai: "飲み放題",
  premium: "プレミアム",
};
