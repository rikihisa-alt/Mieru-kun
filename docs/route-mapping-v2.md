# 新管理画面 / サイネージ ルートマッピング

個人情報保護の観点で、推測可能だったベースパスをランダム文字列に置き換えた。

- 新管理画面ベース: `/k4z8qm3x` (旧 `/v2`)
- サイネージ: `/sg7x2npq` (旧 `/signage`)

旧パス (`/v2`, `/signage`) へのリダイレクトは意図的に設置していない。推測可能パスを存続させないため、旧パスへのアクセスは404となるのが正しい挙動。

なお `(manage)` 配下(旧管理画面, `/dashboard` 等)は本対応より前に別途オパーク化済み(例: `/dashboard` → `/h7p2kx`)。本ドキュメントは `/v2` → `/k4z8qm3x` および `/signage` → `/sg7x2npq` の対応のみを扱う。

## 新管理画面ページ一覧 (`/k4z8qm3x` 配下)

| 旧URL | 新URL |
|---|---|
| `/v2` | `/k4z8qm3x` |
| `/v2/attendance` | `/k4z8qm3x/attendance` |
| `/v2/calendar` | `/k4z8qm3x/calendar` |
| `/v2/checkin` | `/k4z8qm3x/checkin` |
| `/v2/chip-flow` | `/k4z8qm3x/chip-flow` |
| `/v2/closing` | `/k4z8qm3x/closing` |
| `/v2/customers` | `/k4z8qm3x/customers` |
| `/v2/customers/new` | `/k4z8qm3x/customers/new` |
| `/v2/customers/[id]` | `/k4z8qm3x/customers/[id]` |
| `/v2/events` | `/k4z8qm3x/events` |
| `/v2/handover` | `/k4z8qm3x/handover` |
| `/v2/history` | `/k4z8qm3x/history` |
| `/v2/incidents` | `/k4z8qm3x/incidents` |
| `/v2/inventory` | `/k4z8qm3x/inventory` |
| `/v2/live` | `/k4z8qm3x/live` |
| `/v2/multike` | `/k4z8qm3x/multike` |
| `/v2/orders` | `/k4z8qm3x/orders` |
| `/v2/point-rules` | `/k4z8qm3x/point-rules` |
| `/v2/pop` | `/k4z8qm3x/pop` |
| `/v2/products` | `/k4z8qm3x/products` |
| `/v2/ranking` | `/k4z8qm3x/ranking` |
| `/v2/reports` | `/k4z8qm3x/reports` |
| `/v2/reservations` | `/k4z8qm3x/reservations` |
| `/v2/sales` | `/k4z8qm3x/sales` |
| `/v2/settings` | `/k4z8qm3x/settings` |
| `/v2/shifts` | `/k4z8qm3x/shifts` |
| `/v2/sns` | `/k4z8qm3x/sns` |
| `/v2/staff` | `/k4z8qm3x/staff` |
| `/v2/staff/new` | `/k4z8qm3x/staff/new` |
| `/v2/staff/[id]` | `/k4z8qm3x/staff/[id]` |
| `/v2/tables` | `/k4z8qm3x/tables` |
| `/v2/tournaments` | `/k4z8qm3x/tournaments` |

## サイネージページ一覧 (`/sg7x2npq` 配下)

| 旧URL | 新URL |
|---|---|
| `/signage` | `/sg7x2npq` |

## 対応したファイル

- ディレクトリ改名: `src/app/v2` → `src/app/k4z8qm3x`、`src/app/signage` → `src/app/sg7x2npq` (`git mv`)
- 遷移先/リンク先の文字列参照を更新した主なファイル:
  - `src/app/page.tsx` (LP: デモボタン、ロゴリンク、iframeプレビュー)
  - `src/app/(auth)/login/page.tsx`
  - `src/app/(auth)/signup/page.tsx`
  - `src/app/(auth)/auth/callback/route.ts`
  - `src/app/(manage)/layout.tsx` (旧管理画面からのリンク)
  - `src/app/(line-staff)/s6y4bp/page.tsx`
  - `src/components/v2/shell.tsx` (新管理画面のサイドナビ全項目 + サイネージリンク)
  - `src/components/v2/topbar-account.tsx`
  - `src/components/v2/topbar-store-pill.tsx`
  - `src/components/v2/topbar-notifications.tsx`
  - `src/app/k4z8qm3x/` 配下の内部リンク (page.tsx, customers, calendar, orders, staff, reports, checkin など)
  - `src/app/k4z8qm3x/orders/page.tsx` の import パス (`@/app/v2/settings/page` → `@/app/k4z8qm3x/settings/page`)

## 変更していないもの (URLではないため対象外)

- CSSクラス名 `v2-*` / CSS変数 `--v2-*` (`src/app/k4z8qm3x/v2.css`)
- localStorageキー `v2_*`
- モジュールパス `@/lib/v2/*`, `@/components/v2/*` (ディレクトリ名としての `v2` であり、URLパスではない)
- `src/app/k4z8qm3x/layout.tsx` 内の `./v2.css` (ディレクトリ内相対import、変更不要)
