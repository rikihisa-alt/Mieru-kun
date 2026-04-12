-- ============================================================
-- てんぽみえるくん RLS-v2: 追加テーブル用 Row Level Security
-- schema-v2.sql 実行後に実行してください
-- ============================================================

-- ============================================================
-- 1. 全新規テーブルにRLSを有効化
-- ============================================================

ALTER TABLE customer_tag_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_rank_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_method_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wage_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prize_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE closing_adjustment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_result_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_role_histories ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. customer_tag_masters
-- staff+ select, manager+ manage
-- ============================================================
CREATE POLICY "staff_select_tag_masters" ON customer_tag_masters
  FOR SELECT USING (store_id = auth.user_store_id() AND auth.has_role('staff'));

CREATE POLICY "manager_manage_tag_masters" ON customer_tag_masters
  FOR ALL USING (store_id = auth.user_store_id() AND auth.has_role('manager'));

-- ============================================================
-- 3. customer_tags
-- staff+ select, manager+ manage
-- ============================================================
CREATE POLICY "staff_select_customer_tags" ON customer_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = customer_tags.customer_id
      AND customers.store_id = auth.user_store_id()
    ) AND auth.has_role('staff')
  );

CREATE POLICY "manager_manage_customer_tags" ON customer_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = customer_tags.customer_id
      AND customers.store_id = auth.user_store_id()
    ) AND auth.has_role('manager')
  );

-- ============================================================
-- 4. customer_rank_masters
-- staff+ select, owner+ manage
-- ============================================================
CREATE POLICY "staff_select_rank_masters" ON customer_rank_masters
  FOR SELECT USING (store_id = auth.user_store_id() AND auth.has_role('staff'));

CREATE POLICY "owner_manage_rank_masters" ON customer_rank_masters
  FOR ALL USING (store_id = auth.user_store_id() AND auth.has_role('owner'));

-- ============================================================
-- 5. customer_status_logs
-- manager+ select, system insert (staff+ insert for app usage)
-- ============================================================
CREATE POLICY "manager_select_status_logs" ON customer_status_logs
  FOR SELECT USING (store_id = auth.user_store_id() AND auth.has_role('manager'));

CREATE POLICY "staff_insert_status_logs" ON customer_status_logs
  FOR INSERT WITH CHECK (store_id = auth.user_store_id() AND auth.has_role('staff'));

-- ============================================================
-- 6. product_categories
-- staff+ select, manager+ manage
-- ============================================================
CREATE POLICY "staff_select_product_categories" ON product_categories
  FOR SELECT USING (store_id = auth.user_store_id() AND auth.has_role('staff'));

CREATE POLICY "manager_manage_product_categories" ON product_categories
  FOR ALL USING (store_id = auth.user_store_id() AND auth.has_role('manager'));

-- ============================================================
-- 7. payment_method_masters
-- staff+ select, owner+ manage
-- ============================================================
CREATE POLICY "staff_select_payment_methods" ON payment_method_masters
  FOR SELECT USING (store_id = auth.user_store_id() AND auth.has_role('staff'));

CREATE POLICY "owner_manage_payment_methods" ON payment_method_masters
  FOR ALL USING (store_id = auth.user_store_id() AND auth.has_role('owner'));

-- ============================================================
-- 8. store_settings
-- staff+ select own store, owner+ update
-- ============================================================
CREATE POLICY "staff_select_store_settings" ON store_settings
  FOR SELECT USING (store_id = auth.user_store_id() AND auth.has_role('staff'));

CREATE POLICY "owner_manage_store_settings" ON store_settings
  FOR ALL USING (store_id = auth.user_store_id() AND auth.has_role('owner'));

-- ============================================================
-- 9. wage_settings
-- owner+ select/manage
-- ============================================================
CREATE POLICY "owner_select_wage_settings" ON wage_settings
  FOR SELECT USING (store_id = auth.user_store_id() AND auth.has_role('owner'));

CREATE POLICY "owner_manage_wage_settings" ON wage_settings
  FOR ALL USING (store_id = auth.user_store_id() AND auth.has_role('owner'));

-- ============================================================
-- 10. prize_masters
-- staff+ select, manager+ manage
-- ============================================================
CREATE POLICY "staff_select_prize_masters" ON prize_masters
  FOR SELECT USING (store_id = auth.user_store_id() AND auth.has_role('staff'));

CREATE POLICY "manager_manage_prize_masters" ON prize_masters
  FOR ALL USING (store_id = auth.user_store_id() AND auth.has_role('manager'));

-- ============================================================
-- 11. coupon_masters
-- staff+ select, manager+ manage
-- ============================================================
CREATE POLICY "staff_select_coupon_masters" ON coupon_masters
  FOR SELECT USING (store_id = auth.user_store_id() AND auth.has_role('staff'));

CREATE POLICY "manager_manage_coupon_masters" ON coupon_masters
  FOR ALL USING (store_id = auth.user_store_id() AND auth.has_role('manager'));

-- ============================================================
-- 12. customer_coupons
-- customer self-select, staff+ select, staff+ insert
-- ============================================================
CREATE POLICY "customer_select_own_coupons" ON customer_coupons
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "staff_select_customer_coupons" ON customer_coupons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = customer_coupons.customer_id
      AND customers.store_id = auth.user_store_id()
    ) AND auth.has_role('staff')
  );

CREATE POLICY "staff_insert_customer_coupons" ON customer_coupons
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = customer_coupons.customer_id
      AND customers.store_id = auth.user_store_id()
    ) AND auth.has_role('staff')
  );

-- ============================================================
-- 13. visit_status_logs
-- staff+ select
-- ============================================================
CREATE POLICY "staff_select_visit_status_logs" ON visit_status_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM visits
      WHERE visits.id = visit_status_logs.visit_id
      AND visits.store_id = auth.user_store_id()
    ) AND auth.has_role('staff')
  );

CREATE POLICY "staff_insert_visit_status_logs" ON visit_status_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM visits
      WHERE visits.id = visit_status_logs.visit_id
      AND visits.store_id = auth.user_store_id()
    ) AND auth.has_role('staff')
  );

-- ============================================================
-- 14. closing_adjustment_logs
-- owner+ select/insert
-- ============================================================
CREATE POLICY "owner_select_closing_adjustments" ON closing_adjustment_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM daily_closings
      WHERE daily_closings.id = closing_adjustment_logs.closing_id
      AND daily_closings.store_id = auth.user_store_id()
    ) AND auth.has_role('owner')
  );

CREATE POLICY "owner_insert_closing_adjustments" ON closing_adjustment_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_closings
      WHERE daily_closings.id = closing_adjustment_logs.closing_id
      AND daily_closings.store_id = auth.user_store_id()
    ) AND auth.has_role('owner')
  );

-- ============================================================
-- 15. event_result_logs
-- staff+ select, manager+ insert
-- ============================================================
CREATE POLICY "staff_select_event_results" ON event_result_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_result_logs.event_id
      AND events.store_id = auth.user_store_id()
    ) AND auth.has_role('staff')
  );

CREATE POLICY "manager_insert_event_results" ON event_result_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_result_logs.event_id
      AND events.store_id = auth.user_store_id()
    ) AND auth.has_role('manager')
  );

-- ============================================================
-- 16. staff_role_histories
-- owner+ select
-- ============================================================
CREATE POLICY "owner_select_role_histories" ON staff_role_histories
  FOR SELECT USING (store_id = auth.user_store_id() AND auth.has_role('owner'));

CREATE POLICY "owner_insert_role_histories" ON staff_role_histories
  FOR INSERT WITH CHECK (store_id = auth.user_store_id() AND auth.has_role('owner'));
