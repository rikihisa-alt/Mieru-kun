-- ============================================================
-- セキュリティ強化マイグレーション
-- schema.sql, rls.sql 実行後に実行してください
-- ============================================================

-- ============================================================
-- 1. staff_users.role に accounting / owner を追加
-- ============================================================
ALTER TABLE staff_users DROP CONSTRAINT IF EXISTS staff_users_role_check;
ALTER TABLE staff_users ADD CONSTRAINT staff_users_role_check
  CHECK (role IN ('admin', 'owner', 'manager', 'staff', 'accounting'));

-- ============================================================
-- 2. operation_logs を強化 (before_data / after_data 追加)
-- ============================================================
ALTER TABLE operation_logs ADD COLUMN IF NOT EXISTS target_table text;
ALTER TABLE operation_logs ADD COLUMN IF NOT EXISTS before_data jsonb;
ALTER TABLE operation_logs ADD COLUMN IF NOT EXISTS after_data jsonb;
ALTER TABLE operation_logs ADD COLUMN IF NOT EXISTS ip_address text;

-- actor_user_id を明示的に持つ (staff_id のエイリアス)
-- staff_id は既に FK なのでそのまま使用

-- ============================================================
-- 3. 二重実行防止: ユニーク制約
-- ============================================================

-- 同一日の二重締め防止 (既にUNIQUE(store_id, date)あり → 確認)
-- daily_closings に既に UNIQUE(store_id, date) がある

-- visits: 同一顧客のactive visitは1つのみ
CREATE UNIQUE INDEX IF NOT EXISTS idx_visits_active_customer
  ON visits (store_id, customer_id)
  WHERE status = 'active';

-- attendance_logs: 同一スタッフの同日working/on_breakは1つのみ
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_active_staff
  ON attendance_logs (store_id, staff_id)
  WHERE status IN ('working', 'on_break');

-- ============================================================
-- 4. チップ・ポイント残高の再計算関数
-- ============================================================

-- ポイント残高を履歴から再計算
CREATE OR REPLACE FUNCTION recalculate_point_balance(cid uuid)
RETURNS int AS $$
DECLARE
  bal int;
BEGIN
  SELECT COALESCE(SUM(change), 0) INTO bal
  FROM point_logs
  WHERE customer_id = cid;

  UPDATE customers SET point_balance = bal WHERE id = cid;
  RETURN bal;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- チップ残高を履歴から再計算
CREATE OR REPLACE FUNCTION recalculate_chip_balance(cid uuid)
RETURNS int AS $$
DECLARE
  bal int;
BEGIN
  SELECT COALESCE(SUM(change), 0) INTO bal
  FROM chip_balance_logs
  WHERE customer_id = cid;

  UPDATE customers SET chip_balance = bal WHERE id = cid;
  RETURN bal;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
