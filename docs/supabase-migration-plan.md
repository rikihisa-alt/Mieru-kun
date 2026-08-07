# Supabase 段階移行 設計案 + ロードマップ

対象: てんぽみえるくん(アミューズメントカジノ店舗運営SaaS)
目的: 既存(localStorage)を壊さず Supabase 接続基盤を作り、マルチテナントDBへ段階移行する。
最終更新: 2026-07-14 / STEP1〜3(接続基盤)完了時点

---

## 0. 現状サマリ(接続基盤 完了分)

- パッケージ: `@supabase/ssr@^0.10.2` / `@supabase/supabase-js@^2.103.0`(既に導入済み)
- クライアント: `src/lib/supabase/client.ts`(browser) / `server.ts`(server) — `@supabase/ssr` 推奨構成
- セッション: `src/middleware.ts` — cookie リフレッシュ + 認証ゲート(下記フラグで制御)
- 環境変数: `.env.local`(gitignore済・非コミット)に URL と **Publishable Key** を設定。`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` を優先し旧 `ANON_KEY` もフォールバック参照。secret/service_role は不使用。
- **接続確認済み**: auth health 200 / PostgREST がリクエストを認証処理(テーブル未作成のため PGRST205)= 接続成立・キー有効。
- **重要な安全装置**: `NEXT_PUBLIC_AUTH_ENFORCED`(既定OFF)。Supabase を接続しても、このフラグを true にするまで認証ゲートは働かず**全ルート通過(現在の挙動を完全維持)**。認証フェーズで初めて有効化する。
- 本番(Vercel)は環境変数未設定のまま = 従来通りデモ動作。接続する際は Vercel のダッシュボードで同じ2変数を設定する(このリポジトリからは設定不可)。

---

## 1. 既存データ構造の要点(移行の前提となる注意)

詳細な棚卸しは調査済み。設計に効く重要ポイントのみ:

1. **ID採番がバラバラ**: ほぼ全エンティティが `接頭辞${Date.now()}` 系。同一ミリ秒衝突を手動サフィックスで回避している痕跡あり。→ 移行時は **DB側 `uuid`(gen_random_uuid())に統一**、フロントのID生成は撤去。既存の旧IDは `legacy_id text` に温存してマッピング可能に。
2. **自然キー方式のデータ**: 締め(date)/勤怠(staff_id+date)/カレンダー(date)/売上目標(YYYY-MM)/レジ金(`v2_register_float_v1_${today}` = キー名に日付埋め込み)。→ uuid PK + **`UNIQUE(store_id, date[, staff_id])` 複合制約**へ。日付埋め込みキーは単一テーブル+日付カラムに正規化。
3. **ソフトリンク(名前文字列での紐付け)**: `reservations.customerName`(customer_id無し)、`orders.table`/`chip.table`(卓名のみ)、`tables.dealer`(スタッフ名のみ)。→ マルチテナントでは同名衝突(別店舗の「A卓」等)を招くため、移行時に正式な外部キー(customer_id/table_id/staff_id)へ置換。
4. **注文が2系統**: `v2_sales_orders_v1`(店内POS会計)と `tempo_orders_v1`(LINE経由の注文/呼出、`lib/orders/store.ts` の独自クラス)。→ DBでは `orders` に `source`(pos/line)列で統合、または `orders` と `order_calls` に分離。要方針決定。
5. **孤立/未使用データ**: `v2_visit_logs_v1`(書込ゼロ=来店履歴が実は残っていない。checkoutは配列からfilter削除するだけ)、`v2_point_log_v1`(閲覧UIなし)、`store_initial_setup`(sign up後どこからも読まれない)。→ visits移行時に**退店を論理削除(checked_out_at)に変えて履歴を残す**改善を組み込む好機。
6. **デモ初期データの混入リスク**: `domain-stores.ts`/`staff-data.ts` の初期値(商品p1〜p13、スタッフs1〜s6、顧客デモ等)が初回アクセスで自動的にlocalStorageへ書かれる。→ 移行前にクレンジング(デモ行の除外)必須。
7. **旧(manage)系の重複キー**: `page_events_v1` vs `tempo_events_v1`、`settings_*` 群など。旧画面は既に新画面へリダイレクト整理済み。→ **新画面のデータ(`tempo_*`/`v2_*`)に一本化、旧キーは破棄**が前提。

---

## 2. DB設計案(マルチテナント / store_id / RLS前提)

**原則**: 1 Supabaseプロジェクトで全店舗を管理。全「親」テーブルに `store_id uuid not null` を持たせる。子テーブル(order_items 等)は親経由で store_id を辿れるため列不要(または親と一致する制約)。PKは `uuid default gen_random_uuid()`。

### 2-1. テナント / 認証 / 権限
| テーブル | 主要列 | 備考 |
|---|---|---|
| `stores` | id, name, display_name, address, phone, plan, created_at | テナント本体 |
| `store_settings` | store_id **UNIQUE**, open_time, close_time, closed_days[], ranks(jsonb), chip(jsonb), point_rewards(jsonb), entrance_plans(jsonb), time_charge(jsonb), rank_rules(jsonb), fixed_costs(jsonb) | 現行 `tempo_settings_v1`+`settings_time_charge_v1`+`v2_rank_rules_v1`+`v2_fixed_costs_v1` を集約。1店舗1行 |
| `memberships` | user_id(auth.users) , store_id, role(customer/staff/manager/owner) | **RLSの中核**。ユーザー×店舗×ロール |
| `customer_line_accounts` | customer_id, line_user_id, store_id | LINE本人特定(LIFF時) |

### 2-2. 顧客 / 来店
| テーブル | 主要列 |
|---|---|
| `customers` | store_id, name, nickname(ポーカーネーム), phone, pledge_no, date_of_birth, rank, chip_balance, point_balance, multike_balance, total_visits, total_spent, last_visit, is_blacklisted, caution_text, first_visit_checked(jsonb), created_at, legacy_id |
| `visits` | store_id, customer_id(null可=ゲスト), guest_name, table_id(null可), seat_index, checked_in_at, **checked_out_at(null=在店)**, spent | ★退店を論理削除化し履歴を残す |

### 2-3. 卓 / 着席 / ウェイティング / ディーラー
| テーブル | 主要列 |
|---|---|
| `tables` | store_id, name, type(トナメ/トナメ1/トナメ2/リング/サイド/BJ/バカラ/その他), max_seats, created_at |
| `table_assignments` | store_id, table_id, visit_id, seat_index | 現行はvisitsに埋め込み。正規化する場合のみ |
| `dealer_assignments` | store_id, table_id, dealer_staff_id, started_at, duration_min | 現行 `tables.dealer`(名前) を staff_id 化 |
| `dealer_queue` | store_id, staff_id, position | 現行 `v2_dealer_run_v1`(名前配列) |
| `waiting_list` | store_id, customer_id(null可), name, party_size, game_type, status(waiting/called), registered_at, called_at |

### 2-4. 商品 / 注文 / 精算
| テーブル | 主要列 |
|---|---|
| `products` | store_id, name, price, category, active, stock, min_stock, cost |
| `orders` | store_id, source(pos/line), customer_id(null可), customer_name, table_id(null可), status(active/settled/canceled/… + LINE系 new/preparing/served/done), total, payment_method(cash/card/qr/credit), unpaid, settled_at, paid_at, created_at | POS(`v2_sales_orders`)とLINE(`tempo_orders`)を source で統合案 |
| `order_items` | order_id, product_id, name, price, qty, category |
| `stock_movements` | store_id, product_id, delta, reason(sold/adjust/discard), balance_after, created_at |
| (payments/settlements) | orders に統合(payment_method/unpaid/paid_at)。分離する場合のみ `payments` |

### 2-5. チップ / ポイント / ランク
| テーブル | 主要列 |
|---|---|
| `chip_transactions` | store_id, customer_id(null可), table_id(null可), direction(out/in/adjust), amount, game_type, note, created_at |
| `point_transactions` | store_id, customer_id, source(visit/spend/itm/manual), points, rule_id, rule_name, created_at |
| `point_rules` | store_id, name, points, kind(visit/spend/memo), spend_unit, priority, is_active |
| (rank_rules) | store_settings.rank_rules に内包 or 独立テーブル |

### 2-6. 従業員 / 勤怠 / シフト
| テーブル | 主要列 |
|---|---|
| `employees` | store_id, employee_no, last_name, first_name, role, status, salary(jsonb), insurance(jsonb), retired_at, user_id(null可=ログイン紐付け) |
| `attendance` | store_id, staff_id, date, clock_in, clock_out, break_min — **UNIQUE(store_id, staff_id, date)** |
| `shifts` | store_id, staff_id, date, start_time, end_time, role |
| `shift_requests` | store_id, staff_id, date, desired… (将来) |

### 2-7. イベント / 予約 / トナメ
| テーブル | 主要列 |
|---|---|
| `events` | store_id, title, category, date, time, capacity, reserved_count, fee, status |
| `reservations` | store_id, customer_id(**null可、名前ソフトリンクを正規化**), customer_name, nickname, date, time, party, status(pending/confirmed/canceled/no_show/arrived), source |
| `tournaments` | store_id, name, date, buy_in, reentry…, starting_stack, capacity, status, prize(jsonb) |
| `tournament_blind_levels` | tournament_id, level, sb, bb, ante, minutes |
| `tournament_entrants` | tournament_id, customer_id(null可), name, reentries |
| `tournament_results` | tournament_id, rank, entrant_id, prize, itm |

### 2-8. 締め / 日報 / 記録系
| テーブル | 主要列 |
|---|---|
| `daily_closings` | store_id, date, total, cash, card, qr, count, credit, release_float, actual_cash, cash_diff, notes, closed_at — **UNIQUE(store_id, date)** |
| `daily_reports` | store_id, date, payload(jsonb), remarks — UNIQUE(store_id, date) |
| `register_floats` | store_id, date, amount — UNIQUE(store_id, date)(`v2_register_float_v1_${today}` の正規化) |
| `calendar_days` | store_id, date, kind(通常/定休/特別/短縮), note — UNIQUE(store_id, date) |
| `sales_targets` | store_id, year_month, monthly_target, daily_target — UNIQUE(store_id, year_month) |
| `incidents` | store_id, occurred_at, type, severity, customer_id, table_id, staff_id, body, resolution, status, voided |
| `handovers` | store_id, body, author, category, important, created_at (+ `handover_acks` 子: handover_id, staff_id, acked_at) |
| `equipment` | store_id, name, category, qty, condition, last_checked, replace_days, note |
| `sns_schedules` / `sns_templates` / `sns_images`(→ Supabase Storage) / `sns_logs` | store_id 付き。画像は **Storageバケット**へ(現状Base64 localStorage) |
| `audit_logs` | store_id, actor_user_id, action, target, meta(jsonb), created_at |

### 2-9. RLS 方針(将来 auth 有効化時)
- 全テーブルで RLS 有効化。判定は `memberships(user_id, store_id, role)` を参照。
- **customer**: 自分の `customer` 行と、それに紐づく visits/chip/point/reservations のみ(customer_id = 自分)。
- **staff**: 所属 store_id のデータを閲覧・操作(給与など機微は除外ポリシー)。
- **manager**: 管理対象 store_id 群。
- **owner**: 契約範囲の store_id 群 + store_settings 編集。
- ヘルパー: `auth.uid()` → memberships で store_id/role を引く SQL 関数(`current_store_ids()`, `has_role()` 等)を用意し各ポリシーで再利用。

---

## 3. localStorage → Supabase の移行アーキテクチャ(二重保存を避ける)

現在: `画面 → usePersistedState/store → localStorage`
将来: `画面 → Repository/Service → Supabase`

**移行の要**: 画面から直接 localStorage を触るのをやめ、**Repository層(データアクセス抽象)を挟む**。Repositoryの内部実装を「localStorage版」から「Supabase版」へ、**エンティティ単位・Phase単位で切り替える**。

- 切替は**フラグで排他**(そのエンティティは localStorage か Supabase の**どちらか一方のみ**を読み書き)。両方同時書き込み(二重保存)はしない=不整合を構造的に防ぐ。
- 移行期の一時策として「Supabase読取失敗時に localStorage フォールバック(読取のみ)」は許容。ただし**書込みは必ず単一の宛先**に限定。
- 各エンティティの移行手順テンプレ:
  1. DBにテーブル + RLS + インデックス作成(migration SQL)
  2. `src/lib/repositories/<entity>.ts` を作成(現行の usePersistedState と同じインターフェイスを提供する薄い層)
  3. 画面の直接ストア参照を Repository 経由に置換(**UI・型・挙動は不変**)
  4. Repository 内部を Supabase 実装へ切替(フラグ)
  5. 既存 localStorage データのインポート(デモ行を除外、legacy_id 保持)
  6. 回帰確認 → 旧キーの読取停止 → 一定期間後にキー破棄

※ 既存の `src/lib/db/*`・`src/lib/actions/*`(旧システム用スキャフォールド、現在orphan)は、この Repository 層の実装参考として流用可否を精査する(そのまま使わない — スキーマが旧設計のため)。

---

## 4. 段階移行ロードマップ(依存順。全機能一括はしない)

| Phase | 対象 | 主なテーブル | 依存 |
|---|---|---|---|
| **0(完了)** | 接続基盤 | — | Supabase client/server/middleware/env/接続確認 |
| **Phase 1** | 店舗 → 顧客 → 来店 | stores, store_settings, memberships, customers, customer_line_accounts, visits | 認証の土台(auth)もここで最小導入 |
| **Phase 2** | 卓 → 着席 → ウェイティング | tables, table_assignments, dealer_assignments, dealer_queue, waiting_list | Phase1(visits/customers) |
| **Phase 3** | 商品 → 注文 → 精算 | products, orders, order_items, stock_movements | Phase1,2(customer/table) |
| **Phase 4** | チップ → ポイント → ランク | chip_transactions, point_transactions, point_rules | Phase1,3(customer/order) |
| **Phase 5** | 従業員 → 勤怠 → シフト | employees, attendance, shifts, shift_requests | 店舗/認証 |
| **Phase 6** | イベント → 予約 → LINE | events, reservations, tournaments系, sns系, LINE(LIFF/Push) | 全般 |
| **横断** | 締め/日報/レジ金/カレンダー/売上目標/固定費/引き継ぎ/インシデント/備品/監査ログ | 各記録系 | 参照元Phase完了後 |

各Phaseは「テーブル+RLS作成 → Repository実装 → 画面の参照差し替え(UI不変) → データ取込 → 回帰確認 → 旧キー破棄」を1サイクルとする。**Phaseごとに完了を確認してから次へ**。

---

## 5. 今回(基盤)完了の確認 と 次アクション

**完了(今回)**: パッケージ導入(既存)/ client・server・middleware整備 / 環境変数設定(.env.local)/ Publishable Key対応 / 接続確認 / localStorage全棚卸し / DB設計案 / 移行ロードマップ / **既存挙動は不変(AUTH_ENFORCED=OFF)**。

**この段階では実データ移行は行わない。**

**次アクションの候補**(オーナー/開発の判断待ち):
1. 本番でも接続するなら Vercel に `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` を設定(認証は AUTH_ENFORCED 未設定のまま=既存挙動維持)。
2. Phase 1 の着手: `stores`/`store_settings`/`customers` のテーブル+RLS作成 → Repository層 → 顧客画面の参照差し替え(UI不変)。
3. 上記に先立ち、注文2系統(POS/LINE)の統合方針、旧(manage)キーの破棄、デモ初期データのクレンジング方針を確定。
