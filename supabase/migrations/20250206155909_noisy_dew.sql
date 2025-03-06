-- Drop existing policies
DROP POLICY IF EXISTS "enable_vendor_read" ON vendors;
DROP POLICY IF EXISTS "enable_vendor_write" ON vendors;
DROP POLICY IF EXISTS "vendor_read_policy" ON vendors;
DROP POLICY IF EXISTS "vendor_write_policy" ON vendors;
DROP POLICY IF EXISTS "vendor_access_policy" ON vendors;
DROP POLICY IF EXISTS "vendor_public_read_policy" ON vendors;

-- Create simplified policies for vendors table
CREATE POLICY "vendors_read_policy"
  ON vendors
  FOR SELECT
  USING (true);

CREATE POLICY "vendors_write_policy"
  ON vendors
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vendors_update_policy"
  ON vendors
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "vendors_delete_policy"
  ON vendors
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create admin override policy
CREATE POLICY "vendors_admin_policy"
  ON vendors
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Drop existing user policies
DROP POLICY IF EXISTS "enable_user_read" ON users;
DROP POLICY IF EXISTS "enable_user_write" ON users;
DROP POLICY IF EXISTS "allow_all_users" ON users;

-- Create simplified policies for users table
CREATE POLICY "users_read_policy"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "users_write_policy"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_admin_policy"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Ensure RLS is enabled
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON vendors TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT SELECT ON vendors TO anon;
GRANT SELECT ON users TO anon;

-- Add comments to document the changes
COMMENT ON TABLE vendors IS 'Vendor profiles with granular RLS policies';
COMMENT ON TABLE users IS 'User profiles with granular RLS policies';