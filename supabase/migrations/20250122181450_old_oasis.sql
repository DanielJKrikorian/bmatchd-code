-- Drop existing policies and views to start fresh
DROP POLICY IF EXISTS "enable_read_for_all" ON users;
DROP POLICY IF EXISTS "enable_write_for_self" ON users;
DROP POLICY IF EXISTS "enable_read_for_all" ON vendors;
DROP POLICY IF EXISTS "enable_write_for_self" ON vendors;
DROP VIEW IF EXISTS admin_users;
DROP VIEW IF EXISTS vendor_management;
DROP FUNCTION IF EXISTS is_admin;

-- Create simplified policies for users table
CREATE POLICY "users_read_policy"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_write_policy"
  ON users
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = id OR
    auth.jwt()->>'role' = 'authenticated'
  );

-- Create simplified policies for vendors table
CREATE POLICY "vendors_read_policy"
  ON vendors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "vendors_write_policy"
  ON vendors
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    auth.jwt()->>'role' = 'authenticated'
  );

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Grant basic permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;