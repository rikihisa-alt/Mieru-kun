-- ============================================================
-- Phase 1: 顧客拡張 + 権限 + 監査ログ
-- 既存 customers/profiles を壊さず additive に拡張
-- ============================================================

-- ---- profiles に role 列 ----
alter table profiles add column if not exists role text
  check (role in ('owner','manager','staff')) default 'staff';

-- ---- customers に追加カラム ----
-- 既存: last_visit_at, birthday, gender は保持
alter table customers add column if not exists nickname text;
alter table customers add column if not exists line_id text;
alter table customers add column if not exists referrer_customer_id uuid references customers(id);
alter table customers add column if not exists is_blacklisted boolean default false;
alter table customers add column if not exists is_hidden boolean default false;
alter table customers add column if not exists sns_links jsonb default '{}'::jsonb;
alter table customers add column if not exists staff_notes text;
alter table customers add column if not exists caution_text text;
-- birthday と date_of_birth の重複を避け、今後は birthday を正とする

create index if not exists idx_customers_is_blacklisted on customers(is_blacklisted) where is_blacklisted = true;
create index if not exists idx_customers_is_hidden on customers(is_hidden) where is_hidden = true;
create index if not exists idx_customers_referrer on customers(referrer_customer_id) where referrer_customer_id is not null;

-- ---- 同意履歴 ----
create table if not exists customer_consents (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  kind text not null,
  version text not null,
  agreed_at timestamptz not null default now()
);
create index if not exists idx_customer_consents_customer on customer_consents(customer_id, kind);

-- ---- 監査ログ ----
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  store_id uuid,
  action text not null,
  target_table text,
  target_id uuid,
  before jsonb,
  after jsonb,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_logs_actor on audit_logs(actor_id, created_at desc);
create index if not exists idx_audit_logs_target on audit_logs(target_table, target_id);
create index if not exists idx_audit_logs_created on audit_logs(created_at desc);

-- ---- RLS: customers は owner/manager が全閲覧、staff は is_hidden/is_blacklisted 非表示 ----
alter table customers enable row level security;

drop policy if exists customers_select_role_based on customers;
create policy customers_select_role_based on customers for select using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid() and (
      p.role in ('owner','manager')
      or (p.role = 'staff' and customers.is_hidden = false and customers.is_blacklisted = false)
    )
  )
);

-- 同意履歴は owner のみ
alter table customer_consents enable row level security;
drop policy if exists customer_consents_owner_only on customer_consents;
create policy customer_consents_owner_only on customer_consents for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
);

-- 監査ログは owner のみ閲覧、insert は認証ユーザーすべて
alter table audit_logs enable row level security;
drop policy if exists audit_logs_owner_select on audit_logs;
create policy audit_logs_owner_select on audit_logs for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
);
drop policy if exists audit_logs_auth_insert on audit_logs;
create policy audit_logs_auth_insert on audit_logs for insert with check (auth.uid() is not null);
