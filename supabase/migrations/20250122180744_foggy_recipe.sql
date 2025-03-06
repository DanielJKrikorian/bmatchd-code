-- Drop existing policies
DROP POLICY IF EXISTS "vendor_select_policy" ON vendors;
DROP POLICY IF EXISTS "vendor_modify_policy" ON vendors;
DROP POLICY IF EXISTS "user_select_policy" ON users;
DROP POLICY IF EXISTS "user_modify_policy" ON users;

-- Create simplified read-only policy for vendors
CREATE POLICY "vendors_read_policy"
  ON vendors
  FOR SELECT
  TO authenticated
  USING (true);

-- Create simplified write policy for vendors
CREATE POLICY "vendors_write_policy"
  ON vendors
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Create simplified read-only policy for users
CREATE POLICY "users_read_policy"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Create simplified write policy for users
CREATE POLICY "users_write_policy"
  ON users
  FOR ALL
  TO authenticated
  USING (
    id = auth.uid()
  );

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;