-- ============================================================
-- てんぽみえるくん schema-v2: 追加テーブル & 既存テーブル拡張
-- schema.sql 実行後に実行してください
-- ============================================================

-- ============================================================
-- 1. 新規テーブル
-- ============================================================

-- 1-1. customer_tag_masters
CREATE TABLE IF NOT EXISTS customer_tag_masters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (store_id, name)
);

-- 1-2. customer_tags
CREATE TABLE IF NOT EXISTS customer_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES customer_tag_masters(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (customer_id, tag_id)
);

-- 1-3. customer_rank_masters
CREATE TABLE IF NOT EXISTS customer_rank_masters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  rank_code text NOT NULL,
  rank_name text NOT NULL,
  min_visits int DEFAULT 0,
  min_spent int DEFAULT 0,
  point_multiplier numeric(3,2) DEFAULT 1.0,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (store_id, rank_code)
);

-- 1-4. customer_status_logs
CREATE TABLE IF NOT EXISTS customer_status_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  from_rank text,
  to_rank text NOT NULL,
  reason text,
  changed_by uuid REFERENCES staff_users(id),
  created_at timestamptz DEFAULT now()
);

-- 1-5. product_categories
CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (store_id, name)
);

-- 1-6. payment_method_masters
CREATE TABLE IF NOT EXISTS payment_method_masters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (store_id, code)
);

-- 1-7. store_settings
CREATE TABLE IF NOT EXISTS store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (store_id, key)
);

-- 1-8. wage_settings
CREATE TABLE IF NOT EXISTS wage_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  base_hourly_wage int NOT NULL,
  night_multiplier numeric(3,2) DEFAULT 1.25,
  holiday_multiplier numeric(3,2) DEFAULT 1.35,
  effective_from date,
  effective_to date,
  created_at timestamptz DEFAULT now()
);

-- 1-9. prize_masters
CREATE TABLE IF NOT EXISTS prize_masters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  points_required int DEFAULT 0,
  stock int DEFAULT 0,
  image_url text,
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 1-10. coupon_masters
CREATE TABLE IF NOT EXISTS coupon_masters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('fixed', 'percent', 'free_item')),
  discount_value int DEFAULT 0,
  min_purchase int DEFAULT 0,
  max_uses int,
  current_uses int DEFAULT 0,
  valid_from timestamptz,
  valid_until timestamptz,
  target_rank text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (store_id, code)
);

-- 1-11. customer_coupons
CREATE TABLE IF NOT EXISTS customer_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES coupon_masters(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'revoked')),
  used_at timestamptz,
  visit_id uuid REFERENCES visits(id),
  created_at timestamptz DEFAULT now()
);

-- 1-12. visit_status_logs
CREATE TABLE IF NOT EXISTS visit_status_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  changed_by uuid REFERENCES staff_users(id),
  created_at timestamptz DEFAULT now()
);

-- 1-13. closing_adjustment_logs
CREATE TABLE IF NOT EXISTS closing_adjustment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  closing_id uuid NOT NULL REFERENCES daily_closings(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  old_value int,
  new_value int,
  reason text NOT NULL,
  adjusted_by uuid REFERENCES staff_users(id),
  created_at timestamptz DEFAULT now()
);

-- 1-14. event_result_logs
CREATE TABLE IF NOT EXISTS event_result_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  ranking int,
  prize_name text,
  points_awarded int DEFAULT 0,
  notes text,
  created_by uuid REFERENCES staff_users(id),
  created_at timestamptz DEFAULT now()
);

-- 1-15. staff_role_histories
CREATE TABLE IF NOT EXISTS staff_role_histories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  from_role text,
  to_role text NOT NULL,
  changed_by uuid REFERENCES staff_users(id),
  reason text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 2. 既存テーブルの拡張 (ALTER)
-- ============================================================

-- products
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock int DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES product_categories(id);

-- customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_visit_at timestamptz;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS birthday date;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'other'));

-- events
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time time;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time time;
ALTER TABLE events ADD COLUMN IF NOT EXISTS entry_fee int DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type text CHECK (event_type IN ('tournament', 'promotion', 'special'));

-- prize_logs
ALTER TABLE prize_logs ADD COLUMN IF NOT EXISTS prize_master_id uuid REFERENCES prize_masters(id);
ALTER TABLE prize_logs ADD COLUMN IF NOT EXISTS status text DEFAULT 'granted' CHECK (status IN ('granted', 'revoked'));

-- ============================================================
-- 3. インデックス
-- ============================================================

-- customer_tag_masters
CREATE INDEX IF NOT EXISTS idx_customer_tag_masters_store ON customer_tag_masters(store_id);

-- customer_tags
CREATE INDEX IF NOT EXISTS idx_customer_tags_customer ON customer_tags(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_tags_tag ON customer_tags(tag_id);

-- customer_rank_masters
CREATE INDEX IF NOT EXISTS idx_customer_rank_masters_store ON customer_rank_masters(store_id);

-- customer_status_logs
CREATE INDEX IF NOT EXISTS idx_customer_status_logs_store ON customer_status_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_customer_status_logs_customer ON customer_status_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_status_logs_changed_by ON customer_status_logs(changed_by);

-- product_categories
CREATE INDEX IF NOT EXISTS idx_product_categories_store ON product_categories(store_id);

-- payment_method_masters
CREATE INDEX IF NOT EXISTS idx_payment_method_masters_store ON payment_method_masters(store_id);

-- store_settings
CREATE INDEX IF NOT EXISTS idx_store_settings_store ON store_settings(store_id);

-- wage_settings
CREATE INDEX IF NOT EXISTS idx_wage_settings_store ON wage_settings(store_id);
CREATE INDEX IF NOT EXISTS idx_wage_settings_staff ON wage_settings(staff_id);

-- prize_masters
CREATE INDEX IF NOT EXISTS idx_prize_masters_store ON prize_masters(store_id);

-- coupon_masters
CREATE INDEX IF NOT EXISTS idx_coupon_masters_store ON coupon_masters(store_id);

-- customer_coupons
CREATE INDEX IF NOT EXISTS idx_customer_coupons_coupon ON customer_coupons(coupon_id);
CREATE INDEX IF NOT EXISTS idx_customer_coupons_customer ON customer_coupons(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_coupons_visit ON customer_coupons(visit_id);

-- visit_status_logs
CREATE INDEX IF NOT EXISTS idx_visit_status_logs_visit ON visit_status_logs(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_status_logs_changed_by ON visit_status_logs(changed_by);

-- closing_adjustment_logs
CREATE INDEX IF NOT EXISTS idx_closing_adjustment_logs_closing ON closing_adjustment_logs(closing_id);
CREATE INDEX IF NOT EXISTS idx_closing_adjustment_logs_adjusted_by ON closing_adjustment_logs(adjusted_by);

-- event_result_logs
CREATE INDEX IF NOT EXISTS idx_event_result_logs_event ON event_result_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_event_result_logs_customer ON event_result_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_event_result_logs_created_by ON event_result_logs(created_by);

-- staff_role_histories
CREATE INDEX IF NOT EXISTS idx_staff_role_histories_store ON staff_role_histories(store_id);
CREATE INDEX IF NOT EXISTS idx_staff_role_histories_staff ON staff_role_histories(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_role_histories_changed_by ON staff_role_histories(changed_by);

-- products (new FK column)
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

-- prize_logs (new FK column)
CREATE INDEX IF NOT EXISTS idx_prize_logs_prize_master ON prize_logs(prize_master_id);

-- customers (new columns)
CREATE INDEX IF NOT EXISTS idx_customers_last_visit_at ON customers(last_visit_at);
CREATE INDEX IF NOT EXISTS idx_customers_birthday ON customers(birthday);
