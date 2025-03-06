-- Drop existing problematic policies
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_write" ON users;
DROP POLICY IF EXISTS "vendors_select" ON vendors;
DROP POLICY IF EXISTS "vendors_write" ON vendors;
DROP POLICY IF EXISTS "vendors_insert" ON vendors;
DROP POLICY IF EXISTS "vendors_update" ON vendors;
DROP POLICY IF EXISTS "vendors_delete" ON vendors;

-- Create simplified policies for users table
CREATE POLICY "allow_read_users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_update_users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Create simplified policies for vendors table
CREATE POLICY "allow_read_vendors"
  ON vendors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_insert_vendors"
  ON vendors
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "allow_update_vendors"
  ON vendors
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "allow_delete_vendors"
  ON vendors
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON vendors TO authenticated;
GRANT ALL ON users TO authenticated;