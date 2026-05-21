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

// 出荷状態: 空。店舗側で商品マスタから登録する。
export const MENU: MenuItem[] = [];

export const DRINK_CATEGORY_LABEL: Record<Exclude<MenuCategory, "food">, string> = {
  regular: "通常",
  tabehoudai: "飲み放題",
  premium: "プレミアム",
};
