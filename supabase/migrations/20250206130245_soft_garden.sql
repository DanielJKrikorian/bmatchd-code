-- Drop all existing policies
DROP POLICY IF EXISTS "enable_user_read" ON users;
DROP POLICY IF EXISTS "enable_user_write" ON users;
DROP POLICY IF EXISTS "enable_vendor_read" ON vendors;
DROP POLICY IF EXISTS "enable_vendor_write" ON vendors;

-- Create maximally permissive policies for users table
CREATE POLICY "allow_all_users"
  ON users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create maximally permissive policies for vendors table
CREATE POLICY "allow_all_vendors"
  ON vendors
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Grant ALL permissions to authenticated users
GRANT ALL ON users TO authenticated;
GRANT ALL ON vendors TO authenticated;

-- Grant SELECT to anonymous users
GRANT SELECT ON users TO anon;
GRANT SELECT ON vendors TO anon;

-- Add comment to document the changes
COMMENT ON TABLE users IS 'User profiles with permissive RLS policies';
COMMENT ON TABLE vendors IS 'Vendor profiles with permissive RLS policies';