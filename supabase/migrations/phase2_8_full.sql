-- ============================================================
-- Phase 2〜8: チップ2種 / マルチケ / 来店履歴 / 予約 /
-- 会計強化 / イベント / POP / ランキング / ポイントルール /
-- SNS投稿報告 / 監査ログ拡張
-- ============================================================

-- ------------------------------------------------------------
-- Phase 2: チップ（リング/サイド）
-- ------------------------------------------------------------
do $$ begin
  create type tip_kind as enum ('ring','side');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tip_reason as enum (
    'visit_bonus','event_prize','manual_adjust','correction',
    'ring_play','side_play','purchase','withdraw',
    'transfer_in','transfer_out','freeze','unfreeze'
  );
exception when duplicate_object then null; end $$;

create table if not exists tip_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  kind tip_kind not null,
  delta int not null,
  reason tip_reason not null,
  related_transaction_id uuid references tip_transactions(id),
  performed_by uuid references profiles(id),
  device text,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_tip_tx_customer_kind_created
  on tip_transactions(customer_id, kind, created_at desc);

-- チップ残高ビュー
create or replace view tip_balances as
  select customer_id, kind, coalesce(sum(delta), 0) as balance
  from tip_transactions
  group by customer_id, kind;

-- ------------------------------------------------------------
-- マルチケ
-- ------------------------------------------------------------
do $$ begin
  create type multike_reason as enum (
    'grant','use','expire','campaign_grant','manual_adjust','correction'
  );
exception when duplicate_object then null; end $$;

create table if not exists multike_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  delta int not null,
  reason multike_reason not null,
  expires_at timestamptz,
  batch_id uuid,
  performed_by uuid references profiles(id),
  note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_multike_customer_created
  on multike_transactions(customer_id, created_at desc);
create index if not exists idx_multike_expires
  on multike_transactions(expires_at) where expires_at is not null;

-- 有効なマルチケ残高ビュー（期限内のみ集計）
create or replace view multike_balances as
  select customer_id,
    coalesce(sum(case when expires_at is null or expires_at > now() then delta else 0 end), 0) as balance
  from multike_transactions
  group by customer_id;

-- ------------------------------------------------------------
-- Phase 3: 来店履歴 / 予約
-- ------------------------------------------------------------
create table if not exists visit_checkins (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  store_id uuid,
  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz,
  source text check (source in ('staff_manual','member_line','member_qr','staff_qr')) default 'staff_manual',
  staff_id uuid references profiles(id),
  device text,
  note text
);
create index if not exists idx_visit_checkins_customer
  on visit_checkins(customer_id, checked_in_at desc);
create index if not exists idx_visit_checkins_date
  on visit_checkins((checked_in_at::date));

create table if not exists visit_reservations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  guest_name text,
  reserved_for date not null,
  reserved_slot text,
  party_size int default 1,
  note text,
  status text check (status in ('pending','confirmed','canceled','no_show','arrived')) default 'pending',
  source text check (source in ('member_line','staff_manual','phone')) default 'member_line',
  created_at timestamptz not null default now()
);
create index if not exists idx_reservations_for on visit_reservations(reserved_for);
create index if not exists idx_reservations_customer on visit_reservations(customer_id);

-- ------------------------------------------------------------
-- Phase 4: 会計強化
-- ------------------------------------------------------------
do $$ begin
  create type payment_method as enum ('cash','card','qr','tip_offset','multike');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_category as enum (
    'entrance','drink','food','tournament_fee',
    'tip_purchase','tip_use','discount','adjustment','other'
  );
exception when duplicate_object then null; end $$;

-- 既存 orders テーブル（schema-v2.sql）に列を増補
alter table if exists orders add column if not exists outstanding int default 0;
alter table if exists orders add column if not exists refunded_at timestamptz;
alter table if exists orders add column if not exists staff_id uuid references profiles(id);
alter table if exists orders add column if not exists settled_at timestamptz;

-- カテゴリを order_items に持たせる
alter table if exists order_items add column if not exists category order_category default 'other';

-- 支払記録（1注文に複数支払）
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  method payment_method not null,
  amount int not null,
  note text,
  refunded boolean default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_payments_order on payments(order_id);
create index if not exists idx_payments_created on payments(created_at desc);

-- 日次売上集計ビュー
create or replace view sales_daily as
  select
    (created_at at time zone 'Asia/Tokyo')::date as date,
    method,
    sum(amount) as total,
    count(*) as count
  from payments
  where refunded = false
  group by 1, 2
  order by 1 desc;

-- ------------------------------------------------------------
-- Phase 5: イベント / POP / ランキング
-- ------------------------------------------------------------
-- 既存 events テーブル(schema-v2.sql)を拡張
alter table if exists events add column if not exists capacity int;
alter table if exists events add column if not exists reservation_deadline timestamptz;
alter table if exists events add column if not exists is_public boolean default true;
alter table if exists events add column if not exists cover_image_url text;

create table if not exists event_reservations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  customer_id uuid references customers(id),
  party_size int default 1,
  status text check (status in ('reserved','canceled','attended','no_show')) default 'reserved',
  created_at timestamptz not null default now()
);
create index if not exists idx_event_reservations_event on event_reservations(event_id);

create table if not exists pops (
  id uuid primary key default gen_random_uuid(),
  title text,
  image_url text not null,
  sort_order int default 0,
  is_public boolean default true,
  linked_event_id uuid references events(id),
  created_at timestamptz not null default now()
);

-- ランキング用マテビュー(月間来店回数)
create materialized view if not exists ranking_visits_monthly as
  select customer_id,
    to_char(checked_in_at, 'YYYY-MM') as period,
    count(*) as value
  from visit_checkins
  group by customer_id, period;
create index if not exists idx_ranking_visits_monthly
  on ranking_visits_monthly(period, value desc);

-- ------------------------------------------------------------
-- Phase 6: ポイントルールエンジン
-- ------------------------------------------------------------
create table if not exists point_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  points int not null,
  is_active boolean default true,
  priority int default 100,
  starts_at timestamptz,
  ends_at timestamptz,
  description text,
  created_at timestamptz default now()
);

create table if not exists rule_conditions (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references point_rules(id) on delete cascade,
  field text not null,
  operator text not null check (operator in ('eq','neq','gte','gt','lte','lt','in','not_in')),
  value jsonb not null
);

create table if not exists point_logs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  rule_id uuid references point_rules(id),
  points int not null,
  context jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_point_logs_customer on point_logs(customer_id, created_at desc);

create table if not exists season_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_on date not null,
  ends_on date not null,
  is_current boolean default false
);

-- ------------------------------------------------------------
-- Phase 8: SNS投稿報告
-- ------------------------------------------------------------
create table if not exists sns_report_posts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  platform text check (platform in ('x','instagram','tiktok','other')),
  url text,
  hashtags text[],
  reward_points int default 0,
  reviewed boolean default false,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- RLS（権限制御の基本）
-- ------------------------------------------------------------
alter table tip_transactions enable row level security;
alter table multike_transactions enable row level security;
alter table visit_checkins enable row level security;
alter table visit_reservations enable row level security;
alter table payments enable row level security;
alter table event_reservations enable row level security;
alter table pops enable row level security;
alter table point_rules enable row level security;
alter table rule_conditions enable row level security;
alter table point_logs enable row level security;
alter table season_settings enable row level security;
alter table sns_report_posts enable row level security;

-- スタッフ以上なら各テーブルを select 可
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'tip_transactions','multike_transactions',
    'visit_checkins','visit_reservations','payments',
    'event_reservations','pops','point_rules','rule_conditions',
    'point_logs','season_settings','sns_report_posts'
  ])
  loop
    execute format($q$
      drop policy if exists %I_staff_select on %I;
      create policy %I_staff_select on %I for select using (
        exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner','manager','staff'))
      );
    $q$, t, t, t, t);
  end loop;
end $$;

-- owner/manager のみ変更可能なテーブル
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'point_rules','rule_conditions','season_settings','pops'
  ])
  loop
    execute format($q$
      drop policy if exists %I_manager_write on %I;
      create policy %I_manager_write on %I for all using (
        exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner','manager'))
      );
    $q$, t, t, t, t);
  end loop;
end $$;
