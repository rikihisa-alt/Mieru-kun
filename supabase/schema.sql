-- ============================================================
-- てんぽみえるくん DBスキーマ
-- Supabase SQL Editor で実行してください
-- ============================================================

-- 店舗
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_name text,
  address text,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- スタッフ (auth.usersと紐付く)
CREATE TABLE IF NOT EXISTS staff_users (
  id uuid PRIMARY KEY, -- auth.users.id と一致
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('admin','manager','staff')),
  hourly_wage int,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 顧客
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  line_id text,
  phone text,
  email text,
  rank text DEFAULT 'regular' CHECK (rank IN ('regular','silver','gold','vip')),
  total_visits int DEFAULT 0,
  total_spent int DEFAULT 0,
  chip_balance int DEFAULT 0,
  point_balance int DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 来店 (入退店)
CREATE TABLE IF NOT EXISTS visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES staff_users(id),
  table_number text,
  check_in_at timestamptz NOT NULL DEFAULT now(),
  check_out_at timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('active','settled','cancelled')),
  total_amount int DEFAULT 0,
  stay_minutes int,
  created_at timestamptz DEFAULT now()
);

-- 商品
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text DEFAULT 'other' CHECK (category IN ('drink','food','chip','other')),
  price int NOT NULL DEFAULT 0,
  cost int DEFAULT 0,
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 注文
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  visit_id uuid REFERENCES visits(id),
  customer_id uuid REFERENCES customers(id),
  staff_id uuid REFERENCES staff_users(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  total_amount int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 注文明細
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  product_name text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  unit_price int NOT NULL DEFAULT 0,
  subtotal int NOT NULL DEFAULT 0
);

-- 支払い
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  visit_id uuid REFERENCES visits(id),
  customer_id uuid REFERENCES customers(id),
  amount int NOT NULL DEFAULT 0,
  method text DEFAULT 'cash' CHECK (method IN ('cash','card','electronic')),
  status text DEFAULT 'completed' CHECK (status IN ('completed','refunded')),
  created_at timestamptz DEFAULT now()
);

-- 勤怠
CREATE TABLE IF NOT EXISTS attendance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES staff_users(id) ON DELETE CASCADE,
  clock_in timestamptz,
  clock_out timestamptz,
  break_start timestamptz,
  break_end timestamptz,
  break_minutes int DEFAULT 0,
  work_minutes int,
  status text DEFAULT 'working' CHECK (status IN ('working','on_break','finished')),
  created_at timestamptz DEFAULT now()
);

-- ポイント履歴
CREATE TABLE IF NOT EXISTS point_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  change int NOT NULL,
  balance_after int NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- チップ残高履歴
CREATE TABLE IF NOT EXISTS chip_balance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  change int NOT NULL,
  balance_after int NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- プライズ履歴
CREATE TABLE IF NOT EXISTS prize_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  prize_name text NOT NULL,
  points_used int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 在庫履歴
CREATE TABLE IF NOT EXISTS inventory_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  change int NOT NULL,
  stock_after int NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- 日次締め
CREATE TABLE IF NOT EXISTS daily_closings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  date date NOT NULL,
  total_sales int DEFAULT 0,
  total_cost int DEFAULT 0,
  total_visitors int DEFAULT 0,
  total_orders int DEFAULT 0,
  cash_amount int DEFAULT 0,
  card_amount int DEFAULT 0,
  electronic_amount int DEFAULT 0,
  notes text,
  closed_by uuid REFERENCES staff_users(id),
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(store_id, date)
);

-- 売上日次集計
CREATE TABLE IF NOT EXISTS sales_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  date date NOT NULL,
  product_id uuid REFERENCES products(id),
  quantity_sold int DEFAULT 0,
  revenue int DEFAULT 0,
  cost int DEFAULT 0
);

-- イベント
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date date,
  capacity int,
  status text DEFAULT 'draft' CHECK (status IN ('draft','published','ended')),
  created_at timestamptz DEFAULT now()
);

-- イベントエントリー
CREATE TABLE IF NOT EXISTS event_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  status text DEFAULT 'reserved' CHECK (status IN ('reserved','attended','cancelled')),
  created_at timestamptz DEFAULT now()
);

-- お知らせ
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  target text DEFAULT 'all' CHECK (target IN ('all','staff','customers')),
  published_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 操作ログ
CREATE TABLE IF NOT EXISTS operation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES staff_users(id),
  action text NOT NULL,
  target_type text,
  target_id uuid,
  detail jsonb,
  created_at timestamptz DEFAULT now()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_customers_store ON customers(store_id);
CREATE INDEX IF NOT EXISTS idx_visits_store_status ON visits(store_id, status);
CREATE INDEX IF NOT EXISTS idx_visits_customer ON visits(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_visit ON orders(visit_id);
CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_visit ON payment_transactions(visit_id);
CREATE INDEX IF NOT EXISTS idx_attendance_staff ON attendance_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_daily_closings_store_date ON daily_closings(store_id, date);
CREATE INDEX IF NOT EXISTS idx_sales_daily_store_date ON sales_daily(store_id, date);
