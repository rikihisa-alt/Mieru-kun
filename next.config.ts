import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopackは日本語パスで問題があるためWebpackを使用
  turbopack: undefined,

  /**
   * 旧管理画面((manage)グループ, opaqueルート)→ 新管理画面(/k4z8qm3x)への整理。
   * 二重状態の解消が目的。ファイルは削除せず、リダイレクトで現行画面へ寄せる。
   * permanent:false (307) で開始 — 旧URLへの流入が消えたのを確認してから true 化を検討。
   *
   * 【今回リダイレクトしない = 先送り(要判断)】
   *  - /w2f6yp (旧締め): 実DB書込Server Action (closing-actions) の唯一の呼出元。移植/破棄判断が先
   *  - /a9k5dm/q7t3wc (旧顧客新規): createCustomerAction の唯一の呼出元。同上
   *  - /q8v3rc (監査ログ): 新画面に受け皿が無い
   *  - /y4r9vt (店内状況): 新に1:1対応が無い(ダッシュボードが近似)
   *  - /r8w3kc/h9j4dy (注文呼出履歴): 新/history とデータ源が異なる
   *  - 旧詳細ページ (/a9k5dm/[id] 等): 一覧が新へ飛ぶため実質到達不能になる。個別対応は不要
   */
  async redirects() {
    const map: Record<string, string> = {
      "/h7p2kx": "/k4z8qm3x",              // ダッシュボード
      "/m4w9sq": "/k4z8qm3x/checkin",      // 入店管理
      "/v3r8nb": "/k4z8qm3x/tables",       // 卓管理
      "/x6j2fp": "/k4z8qm3x/orders",       // 注文・精算
      "/r8w3kc": "/k4z8qm3x/live",         // ライブ注文
      "/k3f8qm": "/k4z8qm3x/reservations", // 予約
      "/a9k5dm": "/k4z8qm3x/customers",    // 顧客
      "/g8n4vr": "/k4z8qm3x/staff",        // 従業員
      "/g8n4vr/q9m4tx": "/k4z8qm3x/staff/new", // 従業員 新規登録
      "/z5b7lc": "/k4z8qm3x/attendance",   // 勤怠
      "/k4r9hs": "/k4z8qm3x/chip-flow",    // チップフロー
      "/l4p7sf": "/k4z8qm3x/reports",      // 集計
      "/n3k8xh": "/k4z8qm3x/history",      // 履歴
      "/p5d7mg": "/k4z8qm3x/products",     // 商品マスタ
      "/t5k8hy": "/k4z8qm3x/point-rules",  // ポイントルール
      "/c6h2zp": "/k4z8qm3x/ranking",      // ランキング
      "/d7s3xl": "/k4z8qm3x/events",       // イベント
      "/j2m6bw": "/k4z8qm3x/pop",          // POP
      "/f9g4nd": "/k4z8qm3x/multike",      // マルチケ配布
      "/e4s9jq": "/k4z8qm3x/settings",     // 店舗設定
    };
    return Object.entries(map).map(([source, destination]) => ({
      source,
      destination,
      permanent: false,
    }));
  },
};

export default nextConfig;
