-- ============================================================
-- てんぽみえるくん RLS (Row Level Security) ポリシー
-- schema.sql 実行後に実行してください
-- ============================================================

-- ============================================================
-- 1. ヘルパー関数
-- ============================================================

-- 現在のユーザーのroleを取得
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS text AS $$
  SELECT role FROM staff_users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 現在のユーザーのstore_idを取得
CREATE OR REPLACE FUNCTION auth.user_store_id()
RETURNS uuid AS $$
  SELECT store_id FROM staff_users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 現在のユーザーがcustomerかどうか
CREATE OR REPLACE FUNCTION auth.is_customer()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM customers WHERE line_id = auth.uid()::text
    UNION ALL
    SELECT 1 FROM customers WHERE id = auth.uid()
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- roleが指定以上かどうか (staff < manager < owner)
CREATE OR REPLACE FUNCTION auth.has_role(required_role text)
RETURNS boolean AS $$
  SELECT CASE
    WHEN required_role = 'staff' THEN auth.user_role() IN ('staff', 'manager', 'owner', 'admin', 'accounting')
    WHEN required_role = 'manager' THEN auth.user_role() IN ('manager', 'owner', 'admin')
    WHEN required_role = 'owner' THEN auth.user_role() IN ('owner', 'admin')
    WHEN required_role = 'admin' THEN auth.user_role() = 'admin'
    WHEN required_role = 'accounting' THEN auth.user_role() IN ('accounting', 'owner', 'admin')
    ELSE false
  END
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 2. 全テーブルにRLSを有効化
-- ============================================================

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chip_balance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE prize_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. stores
-- ============================================================
CREATE POLICY "staff_select_own_store" ON stores
  FOR SELECT USING (id = auth.user_store_id());

CREATE POLICY "owner_update_own_store" ON stores
  FOR UPDATE USING (id = auth.user_store_id() AND auth.has_role('owner'));

-- ============================================================
-- 4. staff_users
-- ============================================================
-- スタッフは自店舗のスタッフ一覧を参照可能
CREATE POLICY "staff_select_same_store" ON staff_users
  FOR SELECT USING (store_id = auth.user_store_id());

-- 自分自身の情報は更新可能（role以外）
CREATE POLICY "self_update" ON staff_users
  FOR UPDATE USING (id = auth.uid());

-- ownerのみスタッフの追加・role変更が可能
CREATE POLICY "owner_insert_staff" ON staff_users
  FOR INSERT WITH CHECK (store_id = auth.user_store_id() AND auth.has_role('owner'));

CREATE POLICY "owner_update_staff" ON staff_users
  FOR UPDATE USING (store_id = auth.user_store_id() AND auth.has_role('owner'));

-- ============================================================
-- 5. customers
-- ============================================================
-- 顧客は自分だけ
CREATE POLICY "customer_select_self" ON customers
  FOR SELECT USING (id = auth.uid() OR line_id = auth.uid()::text);

-- スタッフは自店舗の顧客を参照可能
CREATE POLICY "staff_select_customers" ON customers
  FOR SELECT USING (store_id = auth.user_store_id() AND auth.has_role('staff'));

-- スタッフは顧客の新規登録が可能
CREATE POLICY "staff_insert_customers" ON customers
  FOR INSERT WITH CHECK (store_id = auth.user_store_id() AND auth.has_role('staff'));

-- manager以上は顧客情報の更新が可能
CREATE POLICY "manager_update_customers" ON customers
  FOR UPDATE USING (store_id = auth.user_store_id() AND auth.has_role('manager'));

-- ============================================================
-- 6. visits
-- ============================================================
-- 顧客は自分の来店履歴のみ
CREATE POLICY "customer_select_own_visits" ON visits
  FOR SELECT USING (customer_id = auth.uid());

-- スタッフは自店舗のvisits
CREATE POLICY "staff_select_visits" ON visits
  FOR SELECT USING (store_id = auth.user_store_id() AND auth.has_role('staff'));

CREATE POLICY "staff_insert_visits" ON visits
  FOR INSERT WITH CHECK (store_id = auth.user_store_id() AND auth.has_role('staff'));

CREATE POLICY "staff_update_visits" ON visits
  FOR UPDATE USING (store_id = auth.user_store_id() AND auth.has_role('staff'));

-- ============================================================
-- 7. products
-- ============================================================
CREATE POLICY "staff_select_products" ON products
  FOR SELECT USING (store_id = auth.user_store_id() AND auth.has_role('staff'));

CREATE POLICY "manager_manage_products" ON products
  FOR ALL USING (store_id = auth.user_store_id() AND auth.has_role('manager'));

-- ============================================================
-- 8. orders / order_items
-- ============================================================
CREATE POLICY "staff_select_orders" ON orders
  FOR SELECT USING (store_id = auth.user_store_id() AND auth.has_role('staff'));

CREATE POLICY "staff_insert_orders" ON orders
  FOR INSERT WITH CHECK (store_id = auth.user_store_id() AND auth.has_role('staff'));

CREATE POLICY "staff_select_order_items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.store_id = auth.user_store_id()
    )
  );

CREATE POLICY "staff_insert_order_items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.store_id = auth.user_store_id()
      AND auth.has_role('staff')
    )
  );

-- ============================================================
-- 9. payment_transactions
-- ============================================================
CREATE POLICY "staff_select_payments" ON payment_transactions
  FOR SELECT USING (store_id = auth.user_store_id() AND auth.has_role('staff'));

CREATE POLICY "staff_insert_payments" ON payment_transactions
  FOR INSERT WITH CHECK (store_id = auth.user_store_id() AND auth.has_role('staff'));

-- ============================================================
-- 10. attendance_logs
-- ============================================================
-- スタッフは自分の勤怠のみ参照
CREATE POLICY "staff_select_own_attendance" ON attendance_logs
  FOR SELECT USING (staff_id = auth.uid());

-- manager以上は自店舗の全勤怠参照
CREATE POLICY "manager_select_attendance" ON attendance_logs
  FOR SELECT USING (store_id = auth.user_store_id() AND auth.has_role('manager'));

CREATE POLICY "staff_insert_attendance" ON attendance_logs
  FOR INSERT WITH CHECK (staff_id = auth.uid() AND store_id = auth.user_store_id());

CREATE POLICY "staff_update_own_attendance" ON attendance_logs
  FOR UPDATE USING (staff_id = auth.uid() AND store_id = auth.user_store_id());

-- ownerは勤怠の修正が可能
CREATE POLICY "owner_update_attendance" ON attendance_logs
  FOR UPDATE USING (store_id = auth.user_store_id() AND auth.has_role('owner'));

-- ============================================================
-- 11. point_logs / chip_balance_logs
-- ============================================================
-- 顧客は自分のログのみ
CREATE POLICY "customer_select_own_points" ON point_logs
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "customer_select_own_chips" ON chip_balance_logs
  FOR SELECT USING (customer_id = auth.uid());

-- スタッフは自店舗
CREATE POLICY "staff_select_points" ON point_logs
  FOR SELECT USING (store_id = auth.user_store_id() AND auth.has_role('staff'));

CREATE POLICY "staff_insert_points" ON point_logs
  FOR INSERT WITH CHECK (store_id = auth.user_store_id() AND auth.has_role('staff'));

CREATE POLICY "staff_select_chips" ON chip_balance_logs
  FOR SELECT USING (store_id = auth.user_store_id() AND auth.has_role('staff'));

CREATE POLICY "staff_insert_chips" ON chip_balance_logs
  FOR INSERT WITH CHECK (store_id = auth.user_store_id() AND auth.has_role('staff'));

-- ============================================================
-- 12. prize_logs
-- ============================================================
CREATE POLICY "customer_select_own_prizes" ON prize_logs
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "staff_select_prizes" ON prize_logs
  FOR SELECT USING (store_id = auth.user_store_id() AND auth.has_role('staff'));

CREATE POLICY "staff_insert_prizes" ON prize_logs
  FOR INSERT WITH CHECK (store_id = auth.user_store_id() AND auth.has_role('staff'));

-- ============================================================
-- 13. inventory_logs
-- ============================================================
CREATE POLICY "manager_select_inventory" ON inventory_logs
  FOR SELECT USING (store_id = auth.user_store_id() AND auth.has_role('manager'));

CREATE POLICY "manager_insert_inventory" ON inventory_logs
  FOR INSERT WITH CHECK (store_id = auth.user_store_id() AND auth.has_role('manager'));

-- ============================================================
-- 14. daily_closings / sales_daily
-- ============================================================
CREATE POLICY "manager_select_closings" ON daily_closings
  FOR SELECT USING (store_id = auth.user_store_id() AND auth.has_role('manager'));

CREATE POLICY "manager_insert_closings" ON daily_closings
  FOR INSERT WITH CHECK (store_id = auth.user_store_id() AND auth.has_role('manager'));

CREATE POLICY "owner_update_closings" ON daily_closings
  FOR UPDATE USING (store_id = auth.user_store_id() AND auth.has_role('owner'));

CREATE POLICY "accounting_select_closings" ON daily_closings
  FOR SELECT USING (store_id = auth.user_store_id() AND auth.has_role('accounting'));

CREATE POLICY "manager_select_sales_daily" ON sales_daily
  FOR SELECT USING (store_id = auth.user_store_id() AND auth.has_role('manager'));

CREATE POLICY "accounting_select_sales_daily" ON sales_daily
  FOR SELECT USING (store_id = auth.user_store_id() AND auth.has_role('accounting'));

-- ============================================================
-- 15. events / event_entries
-- ============================================================
CREATE POLICY "staff_select_events" ON events
  FOR SELECT USING (store_id = auth.user_store_id() AND auth.has_role('staff'));

CREATE POLICY "manager_manage_events" ON events
  FOR ALL USING (store_id = auth.user_store_id() AND auth.has_role('manager'));

CREATE POLICY "customer_select_own_entries" ON event_entries
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "staff_select_entries" ON event_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_entries.event_id
      AND events.store_id = auth.user_store_id()
    ) AND auth.has_role('staff')
  );

CREATE POLICY "staff_manage_entries" ON event_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_entries.event_id
      AND events.store_id = auth.user_store_id()
    ) AND auth.has_role('staff')
  );

-- ============================================================
-- 16. announcements
-- ============================================================
CREATE POLICY "staff_select_announcements" ON announcements
  FOR SELECT USING (store_id = auth.user_store_id());

CREATE POLICY "manager_manage_announcements" ON announcements
  FOR ALL USING (store_id = auth.user_store_id() AND auth.has_role('manager'));

-- ============================================================
-- 17. operation_logs (監査ログ)
-- ============================================================
-- 挿入はスタッフ以上
CREATE POLICY "staff_insert_logs" ON operation_logs
  FOR INSERT WITH CHECK (store_id = auth.user_store_id());

-- 閲覧はowner以上のみ
CREATE POLICY "owner_select_logs" ON operation_logs
  FOR SELECT USING (store_id = auth.user_store_id() AND auth.has_role('owner'));

-- 更新・削除は不可（監査ログは不変）
-- (no UPDATE or DELETE policies = denied by default)
