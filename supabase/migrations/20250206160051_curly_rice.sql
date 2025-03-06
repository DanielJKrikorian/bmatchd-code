-- Drop existing policies
DROP POLICY IF EXISTS "vendors_read_policy" ON vendors;
DROP POLICY IF EXISTS "vendors_write_policy" ON vendors;
DROP POLICY IF EXISTS "vendors_update_policy" ON vendors;
DROP POLICY IF EXISTS "vendors_delete_policy" ON vendors;
DROP POLICY IF EXISTS "vendors_admin_policy" ON vendors;
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "users_write_policy" ON users;
DROP POLICY IF EXISTS "users_admin_policy" ON users;

-- Create maximally permissive policy for users table
CREATE POLICY "allow_all_access"
  ON users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create maximally permissive policy for vendors table
CREATE POLICY "allow_all_access"
  ON vendors
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON vendors TO authenticated;
GRANT SELECT ON users TO anon;
GRANT SELECT ON vendors TO anon;

-- Add comment to document the changes
COMMENT ON TABLE users IS 'User profiles with permissive RLS policies';
COMMENT ON TABLE vendors IS 'Vendor profiles with permissive RLS policies';