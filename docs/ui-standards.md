# てんぽみえるくん UI統一基準 (v2管理画面)

ベース = ダッシュボード(/v2)の色合い。白背景 + パステルグリーン + 緑アクセント。
このドキュメントは全ページが従う唯一の基準。ページ側での独自スタイル発明を禁止し、ここに無いパターンが必要になったら v2.css / ui.tsx に追加してから使う。

## 1. 色 — 生HEX禁止、必ずトークン

- テキスト: `--v2-text` / 補助 `--v2-text-sub` / 弱 `--v2-text-mute`
- アクセント: `--v2-accent` (塗り) / `--v2-accent-text` (文字) / `--v2-accent-soft` (背景)
- 状態: `--v2-success` `--v2-danger` `--v2-warn` `--v2-info` + 各 `-bg` (薄背景)
- 境界: `--v2-border` / 強 `--v2-border-strong`
- 例外的に許可される固定色: ポーカー卓フェルトのグラデーション、ランク色トークン (`--v2-rank-vip` `--v2-rank-gold` `--v2-rank-silver` `--v2-rank-regular`)
- 金額・数値の増減: プラス=`--v2-success` / マイナス=`--v2-danger`。3段階警戒は danger/warn/success/mute の順

## 2. ページ骨格

```tsx
<VStack gap={16}>
  <PageHeader title="ページ名" sub="件数・状態のサマリ" action={<Btn variant="primary">主要アクション</Btn>} />
  {/* 検索・フィルタ行 (必要な場合) */}
  <div className="v2-toolbar"> ... </div>
  {/* KPI (必要な場合) */}
  <Kpis> <Kpi/> ... </Kpis>
  <Panel title="..."> ... </Panel>
</VStack>
```
- ページ直下は必ず `VStack gap={16}`。マージンの手打ちで間隔を作らない
- 見出しは PageHeader の title のみが h1。ページ内の中見出しは Panel の title か `.v2-section-label`
- KPIは Kpis/Kpi コンポーネントのみ。独自KPIカードを作らない

## 3. ボタン — 素の `<button>` 禁止、Btn を使う

- 主要アクション(1ページ1つが原則): `<Btn variant="primary">`
- 通常: `<Btn>` / 行内の軽い操作: `<Btn variant="ghost" size="sm">` or `size="xs"`
- 破壊的: `<Btn variant="danger">`(実行系) or ghost+dangerテキスト(行内の削除)
- アイコンは lucide 14px、`<Btn><Plus size={14}/> 追加</Btn>` の並び
- 例外(素buttonが許される): 卓の席・チップなど特殊形状のインタラクション要素

## 4. フィルタ・検索

- 検索ボックス: 左に `Search` アイコン(14px, absolute)、`paddingLeft: 30`、maxWidth 360
- 絞り込みは `.v2-filter-chip`(+`.is-active`)のピル行。`<select>` の羅列にしない(3択以上の列挙のみselect可)
- 件数表示は toolbar 右端に `v2-mute 12px`

## 5. テーブル

- 必ず `className="v2-table"`。数値列は `<td className="v2-num-cell">`、金額は `¥{n.toLocaleString()}`
- 行クリック遷移がある場合は hover 背景(v2-tableの標準)に任せ、行内ボタンは `stopPropagation`
- 空状態は `<Empty>案内文</Empty>`(tbody内なら colSpan で)
- 長文セルは `maxWidth + ellipsis + title` 属性

## 6. モーダル・フォーム

- Modal の footer は右寄せで `<Btn>キャンセル</Btn><Btn variant="primary">保存</Btn>` の順
- フォーム項目は `<Field label="..." required hint="...">` + 素の input/select (v2.cssが整形)
- 2カラムにしたい時は `.v2-form-grid`
- 数値入力は `type="text" inputMode="numeric"` + 全角変換 (`toHalfWidthNumber`/`toHalfWidthDigits`) + `onFocus={e=>e.target.select()}`
- 削除は `confirm()`、対象名と影響を文言に含める

## 7. フィードバック

- 保存/実行成功: `.v2-toast`(右上固定、success系、2.5〜3.5秒で消える)。alert() を成功通知に使わない
- 警告バナー: `.v2-banner` + `.v2-banner--warn` / `--danger` / `--info`
- バリデーション失敗: 入力欄の近くに 12px danger テキスト。alert は最終手段

## 8. チップ・バッジ・ステータス

- `<Chip>` / `<Chip variant="success|warn|danger">` のみ。独自の丸角spanを作らない
- ランクバッジ: ランク色トークン + 白文字 or soft背景。表示名はポーカーネーム優先
- 日時は `toLocaleDateString("ja-JP")` / 時刻は HH:MM。相対表示(○分前)は補助として

## 9. 数値・タイポグラフィ

- 数値は常に tabular-nums (`.v2-num` / `v2-num-cell` / KPI標準)
- フォントサイズ: 本文13 / 補助12 / 微11 / ラベル11 uppercase / KPI値 22-28
- letter-spacing・font-weight を手打ちで散らさない(見出し700、強調600、本文400-500)

## 10. LINEページ (.ln) とサイネージ

- LINE側は line.css の ln-* を同様に厳守(ln-card/ln-btn/ln-chip/ln-list)。v2トークンと同じ色相
- サイネージはダークトーン独自でよいが、アクセント緑・状態色の色相は v2 と揃える

## 11. アイコン

- lucide-react のみ。行内14px / 見出し16px / ナビ18px。絵文字をUIに使わない(文言内は可)

## 12. レスポンシブ — スマホ(375px)・iPad(768〜1024px)・PC全対応が必須

- **ページ全体の横スクロールを絶対に発生させない**。横に広い要素(テーブル・グラフ・フロアマップ)は `.v2-table-wrap`(overflow-x:auto)等の**要素内スクロール**に閉じ込める
- テーブルは必ず `.v2-table-wrap` で包む。5列以上のテーブルはスマホで内側横スクロール
- KPI(Kpis)は auto-fit グリッドで自動折返し(スマホ2列→PC4列)
- `.v2-form-grid` は900px以下で1カラム
- モーダルは `max-height: 85vh; overflow-y: auto`、スマホでは画面幅-32px
- 幅の固定(px)は原則禁止。`maxWidth` + `flex/grid` で流動させる。ボタン・入力は縮んでも折返しで壊れない構成に
- タップ操作(iPad想定): 行内ボタンも最低32px、主要操作は40px以上の当たり判定
- 検証基準: 375px / 768px / 1280px の3幅でレイアウト破綻・横スクロールが無いこと

## 13. 余白 — 「変な空白」の禁止

- 間隔は VStack gap=16 と Panel 内 padding のみで作る。**手打ちの margin/paddingで大きな空白を作らない**
- `minHeight` / 固定 `height` でパネルを間延びさせない(内容に応じた高さ)
- 空のカラム・空のセル・使わない領域を残さない。データが無い場合は `<Empty>` を小さく出す(巨大な空白パネルにしない)
- PageHeader と最初のコンテンツの間、パネル間は 16px で統一。それ以上空ける必要がある設計は見直す
- 二重パディング禁止 (Panel の中に更に padding 16 の箱を入れない)
