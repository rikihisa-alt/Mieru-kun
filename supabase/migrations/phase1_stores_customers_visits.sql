-- =====================================================================
-- Phase 1 マイグレーション: stores / customers / visits (+ 補助)
-- てんぽみえるくん — localStorage → Supabase 段階移行 Phase 1
-- 対象: 店舗 → 顧客 → 来店 のみ。注文/卓/チップ/ポイント/勤怠/LINE は対象外。
--
-- 適用方法: Supabase ダッシュボード → SQL Editor でこのファイルを実行。
--   (Publishable/anon キーでは DDL 不可のため、特権のある SQL Editor で流す)
-- マルチテナント前提: 主要テーブルに store_id。RLS は本ファイルで設計・有効化。
--   ただし本番認証はまだ無効。開発用に anon が「開発店舗のみ」触れる暫定ポリシーを付与。
-- =====================================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------------
-- 共通: updated_at 自動更新トリガ
-- ------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ------------------------------------------------------------------
-- ロール型 (将来 RLS で使用)
-- ------------------------------------------------------------------
do $$ begin
  create type app_role as enum ('customer', 'staff', 'manager', 'owner');
exception when duplicate_object then null; end $$;

-- ==================================================================
-- 1. stores (テナント本体)
-- ==================================================================
create table if not exists stores (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  display_name text,
  address      text,
  phone        text,
  plan         text default 'standard',
  is_active     boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
drop trigger if exists trg_stores_updated on stores;
create trigger trg_stores_updated before update on stores
  for each row execute function set_updated_at();

-- ==================================================================
-- 2. store_settings (店舗設定。1店舗1行。現行 tempo_settings_v1 等を集約)
-- ==================================================================
create table if not exists store_settings (
  store_id       uuid primary key references stores(id) on delete cascade,
  store_name     text,
  display_name   text,
  address        text,
  phone          text,
  open_time      text,
  close_time     text,
  closed_days    text[]  default '{}',
  ranks          jsonb   default '[]',
  rank_label     text,
  chip           jsonb   default '{}',
  point_unit     text,
  point_label    text,
  point_rewards  jsonb   default '[]',
  entrance       jsonb   default '{}',    -- enabled/required/settlement_mode/plans
  time_charge    jsonb   default '{}',    -- settings_time_charge_v1 相当
  rank_rules     jsonb   default '{}',    -- v2_rank_rules_v1 相当
  fixed_costs    jsonb   default '[]',    -- v2_fixed_costs_v1 相当
  updated_at     timestamptz not null default now()
);
drop trigger if exists trg_store_settings_updated on store_settings;
create trigger trg_store_settings_updated before update on store_settings
  for each row execute function set_updated_at();

-- ==================================================================
-- 3. memberships (ユーザー×店舗×ロール。RLSの中核。認証有効化時に使用)
-- ==================================================================
create table if not exists memberships (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  store_id   uuid not null references stores(id) on delete cascade,
  role       app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, store_id)
);
create index if not exists idx_memberships_user on memberships(user_id);
create index if not exists idx_memberships_store on memberships(store_id);

-- ==================================================================
-- 4. customers (顧客。将来 LINE/来店/チップ/ポイント/ランク/注文の中心)
--    現行 CustomerRecord(tempo_customers_v1) を反映。line_id は別表へ分離。
-- ==================================================================
create table if not exists customers (
  id                 uuid primary key default gen_random_uuid(),
  store_id           uuid not null references stores(id) on delete cascade,
  legacy_id          text,                     -- 旧 localStorage ID (移行マッピング用)
  name               text not null,            -- 本名 (店側のみ)
  nickname           text not null default '', -- ポーカーネーム (客側表示)
  rank               text not null default 'regular'
                       check (rank in ('regular','silver','gold','vip')),
  phone              text,
  pledge_no          text,                     -- 誓約書管理番号
  email              text,
  date_of_birth      date,
  referrer_name      text,
  notes              text,
  caution_text       text,
  is_blacklisted     boolean not null default false,
  is_hidden          boolean not null default false,
  first_visit_checked jsonb,                   -- {ageVerified,pledgeSigned,rulesExplained,checkedAt}
  sns_x              text,
  sns_ig             text,
  sns_tiktok         text,
  total_visits       integer not null default 0,
  total_spent        bigint  not null default 0,
  chip_balance       bigint  not null default 0,
  point_balance      bigint  not null default 0,
  multike_balance    bigint  not null default 0,
  last_visit         date,
  prize_count        integer not null default 0,
  last_prize         date,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists idx_customers_store on customers(store_id);
create index if not exists idx_customers_store_phone on customers(store_id, phone);
create index if not exists idx_customers_store_nickname on customers(store_id, nickname);
create unique index if not exists uq_customers_store_legacy on customers(store_id, legacy_id) where legacy_id is not null;
drop trigger if exists trg_customers_updated on customers;
create trigger trg_customers_updated before update on customers
  for each row execute function set_updated_at();

-- ==================================================================
-- 5. customer_line_accounts (LINE本人特定。将来のLIFF連携用。今回はテーブルのみ)
-- ==================================================================
create table if not exists customer_line_accounts (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references stores(id) on delete cascade,
  customer_id  uuid not null references customers(id) on delete cascade,
  line_user_id text not null,
  created_at   timestamptz not null default now(),
  unique (store_id, line_user_id)
);
create index if not exists idx_line_accounts_customer on customer_line_accounts(customer_id);

-- ==================================================================
-- 6. visits (来店。★退店は削除せず checked_out_at 更新。履歴を永続化)
--    将来: LINE QR来店 → visit生成 → 未着席 → 卓着席(Phase2) → 注文(Phase3) → 精算 → 退店
-- ==================================================================
create table if not exists visits (
  id                   uuid primary key default gen_random_uuid(),
  store_id             uuid not null references stores(id) on delete cascade,
  customer_id          uuid references customers(id) on delete set null, -- null=ゲスト
  legacy_id            text,
  guest_name           text,                 -- 顧客未紐付け時の表示名
  checked_in_at        timestamptz not null default now(),
  checked_out_at       timestamptz,          -- null = 在店中
  status               text not null default 'in_store'
                         check (status in ('in_store','left')),
  -- 着席情報 (卓は Phase2 で正式化。今は緩く保持。FKは張らない)
  table_id             uuid,
  seat_index           integer,
  -- 入店料 (既存 checkin の entrance 概念に対応。運用に合わせ任意)
  entrance_fee         bigint,
  entrance_fee_status  text check (entrance_fee_status in ('unpaid','paid','waived')),
  source               text not null default 'staff'
                         check (source in ('staff','line_qr','self')),
  note                 text,
  spent                bigint not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists idx_visits_store on visits(store_id);
-- 在店中(未退店)の高速取得
create index if not exists idx_visits_instore on visits(store_id) where checked_out_at is null;
-- 顧客の来店履歴
create index if not exists idx_visits_customer on visits(store_id, customer_id, checked_in_at desc);
drop trigger if exists trg_visits_updated on visits;
create trigger trg_visits_updated before update on visits
  for each row execute function set_updated_at();

-- ==================================================================
-- RLS: 有効化 + ポリシー設計
--   本番想定(認証あり) = 役割ベース。開発中(認証なし) = anon が開発店舗のみ。
-- ==================================================================
alter table stores                 enable row level security;
alter table store_settings         enable row level security;
alter table memberships            enable row level security;
alter table customers              enable row level security;
alter table customer_line_accounts enable row level security;
alter table visits                 enable row level security;

-- 認証ユーザーが所属する店舗ID集合 (RLSヘルパ)
create or replace function auth_store_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select store_id from memberships where user_id = auth.uid();
$$;

-- ------------------------------------------------------------------
-- 本番想定ポリシー (認証あり。role: staff/manager/owner は所属店舗、customer は自分のみ)
--   ※ 認証が有効化される Phase まで anon 開発ポリシー(後述)と併存して構わない。
-- ------------------------------------------------------------------
-- stores: 所属店舗のみ参照(owner/manager が編集)
drop policy if exists p_stores_auth_select on stores;
create policy p_stores_auth_select on stores for select to authenticated
  using (id in (select auth_store_ids()));

-- store_settings / customers / visits / line_accounts: 所属店舗のデータのみ
drop policy if exists p_store_settings_auth on store_settings;
create policy p_store_settings_auth on store_settings for all to authenticated
  using (store_id in (select auth_store_ids())) with check (store_id in (select auth_store_ids()));

drop policy if exists p_customers_auth on customers;
create policy p_customers_auth on customers for all to authenticated
  using (store_id in (select auth_store_ids())) with check (store_id in (select auth_store_ids()));

drop policy if exists p_visits_auth on visits;
create policy p_visits_auth on visits for all to authenticated
  using (store_id in (select auth_store_ids())) with check (store_id in (select auth_store_ids()));

drop policy if exists p_line_accounts_auth on customer_line_accounts;
create policy p_line_accounts_auth on customer_line_accounts for all to authenticated
  using (store_id in (select auth_store_ids())) with check (store_id in (select auth_store_ids()));

drop policy if exists p_memberships_auth on memberships;
create policy p_memberships_auth on memberships for select to authenticated
  using (user_id = auth.uid());

-- ------------------------------------------------------------------
-- 【開発用・暫定】anon(認証なしクライアント)が「開発店舗」のみ操作可能。
--   認証未実装のあいだ開発を進めるための橋渡し。店舗間分離は開発店舗ID固定で担保。
--   ★本番/マルチテナント公開前に必ず削除すること(認証ポリシーへ切替)。
--   開発店舗ID: 00000000-0000-0000-0000-0000000000d5 (アプリ側の DEV_STORE_ID と一致)
-- ------------------------------------------------------------------
drop policy if exists p_dev_stores on stores;
create policy p_dev_stores on stores for all to anon
  using (id = '00000000-0000-0000-0000-0000000000d5')
  with check (id = '00000000-0000-0000-0000-0000000000d5');

drop policy if exists p_dev_store_settings on store_settings;
create policy p_dev_store_settings on store_settings for all to anon
  using (store_id = '00000000-0000-0000-0000-0000000000d5')
  with check (store_id = '00000000-0000-0000-0000-0000000000d5');

drop policy if exists p_dev_customers on customers;
create policy p_dev_customers on customers for all to anon
  using (store_id = '00000000-0000-0000-0000-0000000000d5')
  with check (store_id = '00000000-0000-0000-0000-0000000000d5');

drop policy if exists p_dev_visits on visits;
create policy p_dev_visits on visits for all to anon
  using (store_id = '00000000-0000-0000-0000-0000000000d5')
  with check (store_id = '00000000-0000-0000-0000-0000000000d5');

drop policy if exists p_dev_line_accounts on customer_line_accounts;
create policy p_dev_line_accounts on customer_line_accounts for all to anon
  using (store_id = '00000000-0000-0000-0000-0000000000d5')
  with check (store_id = '00000000-0000-0000-0000-0000000000d5');

-- ==================================================================
-- 開発店舗レコード(本番デモ混入なし。これは「デモ顧客」ではなく開発テナントの器)
--   ※ 顧客のデモデータはここには入れない。デモ投入は別ファイル(dev_seed)で明示実行。
-- ==================================================================
insert into stores (id, name, display_name)
values ('00000000-0000-0000-0000-0000000000d5', 'Dev Store', '開発店舗')
on conflict (id) do nothing;

insert into store_settings (store_id, store_name, display_name)
values ('00000000-0000-0000-0000-0000000000d5', 'Come On Casino', 'カモンカジノ')
on conflict (store_id) do nothing;

-- 完了。顧客のデモデータは含めない(本番にデモが入らないため)。
-- デモ投入が必要な開発時のみ supabase/seed/dev_seed_customers.sql を手動実行する。
