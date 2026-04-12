/** 商品カテゴリ */
export const PRODUCT_CATEGORIES = [
  { value: "drink", label: "ドリンク" },
  { value: "food", label: "フード" },
  { value: "chip", label: "チップ" },
  { value: "other", label: "その他" },
] as const;

/** 顧客ランク */
export const CUSTOMER_RANKS = [
  { value: "regular", label: "レギュラー" },
  { value: "silver", label: "シルバー" },
  { value: "gold", label: "ゴールド" },
  { value: "vip", label: "VIP" },
] as const;

/** 支払方法 */
export const PAYMENT_METHODS = [
  { value: "cash", label: "現金" },
  { value: "card", label: "カード" },
  { value: "electronic", label: "電子マネー" },
  { value: "chip", label: "チップ" },
] as const;

/** イベント種別 */
export const EVENT_TYPES = [
  { value: "tournament", label: "トーナメント" },
  { value: "promotion", label: "プロモーション" },
  { value: "special", label: "スペシャル" },
] as const;

/** お知らせ対象 */
export const ANNOUNCEMENT_TARGETS = [
  { value: "all", label: "全員" },
  { value: "staff", label: "スタッフのみ" },
  { value: "customers", label: "顧客のみ" },
] as const;

/** クーポン割引種別 */
export const DISCOUNT_TYPES = [
  { value: "fixed", label: "固定額割引" },
  { value: "percent", label: "割合割引" },
  { value: "free_item", label: "商品無料" },
] as const;

/** ポイント変動理由 */
export const POINT_REASONS = [
  { value: "visit", label: "来店ポイント" },
  { value: "purchase", label: "購入ポイント" },
  { value: "event", label: "イベント" },
  { value: "prize_exchange", label: "プライズ交換" },
  { value: "adjustment", label: "調整" },
  { value: "campaign", label: "キャンペーン" },
] as const;

/** チップ変動理由 */
export const CHIP_REASONS = [
  { value: "purchase", label: "購入" },
  { value: "game_win", label: "ゲーム獲得" },
  { value: "game_use", label: "ゲーム使用" },
  { value: "prize_exchange", label: "プライズ交換" },
  { value: "adjustment", label: "調整" },
  { value: "bonus", label: "ボーナス" },
] as const;
