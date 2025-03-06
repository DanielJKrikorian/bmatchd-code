-- Drop existing problematic policies
DROP POLICY IF EXISTS "allow_read_for_all" ON users;
DROP POLICY IF EXISTS "allow_write_for_admins" ON users;
DROP POLICY IF EXISTS "allow_vendor_read_for_all" ON vendors;
DROP POLICY IF EXISTS "allow_vendor_write_for_admins" ON vendors;
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "users_write_policy" ON users;
DROP POLICY IF EXISTS "vendors_read_policy" ON vendors;
DROP POLICY IF EXISTS "vendors_write_policy" ON vendors;
DROP POLICY IF EXISTS "enable_read_access" ON users;
DROP POLICY IF EXISTS "enable_write_access" ON users;
DROP POLICY IF EXISTS "enable_vendor_read" ON vendors;
DROP POLICY IF EXISTS "enable_vendor_write" ON vendors;

-- Create simplified non-recursive policies for users table
CREATE POLICY "anon_select_users"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "auth_update_users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create simplified non-recursive policies for vendors table
CREATE POLICY "anon_select_vendors"
  ON vendors
  FOR SELECT
  USING (true);

CREATE POLICY "auth_insert_vendors"
  ON vendors
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "auth_update_vendors"
  ON vendors
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "auth_delete_vendors"
  ON vendors
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create simplified non-recursive policies for couples table
CREATE POLICY "anon_select_couples"
  ON couples
  FOR SELECT
  USING (true);

CREATE POLICY "auth_insert_couples"
  ON couples
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "auth_update_couples"
  ON couples
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "auth_delete_couples"
  ON couples
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;