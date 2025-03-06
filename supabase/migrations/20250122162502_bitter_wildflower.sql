-- Drop all existing policies
DROP POLICY IF EXISTS "enable_read_access" ON users;
DROP POLICY IF EXISTS "enable_write_access" ON users;
DROP POLICY IF EXISTS "enable_vendor_read" ON vendors;
DROP POLICY IF EXISTS "enable_vendor_write" ON vendors;

-- Create simplified non-recursive policies for users table
CREATE POLICY "allow_read_for_all"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_write_for_admins"
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

-- Create simplified non-recursive policies for vendors table
CREATE POLICY "allow_vendor_read_for_all"
  ON vendors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_vendor_write_for_admins"
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

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON vendors TO authenticated;