-- Drop existing policies
DROP POLICY IF EXISTS "user_read_access_policy" ON users;
DROP POLICY IF EXISTS "user_write_access_policy" ON users;
DROP POLICY IF EXISTS "vendor_access_policy" ON vendors;
DROP POLICY IF EXISTS "vendor_public_read_policy" ON vendors;

-- Create simplified policies for users table
CREATE POLICY "enable_user_read"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "enable_user_write"
  ON users
  FOR ALL
  TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create simplified policies for vendors table
CREATE POLICY "enable_vendor_read"
  ON vendors
  FOR SELECT
  USING (true);

CREATE POLICY "enable_vendor_write"
  ON vendors
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON vendors TO authenticated;
GRANT SELECT ON users TO anon;
GRANT SELECT ON vendors TO anon;

-- Add comment to document the changes
COMMENT ON TABLE users IS 'User profiles with simplified RLS policies';
COMMENT ON TABLE vendors IS 'Vendor profiles with simplified RLS policies';