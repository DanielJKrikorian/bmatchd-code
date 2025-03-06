-- Drop all existing policies
DROP POLICY IF EXISTS "enable_read_access" ON users;
DROP POLICY IF EXISTS "enable_write_access" ON users;
DROP POLICY IF EXISTS "enable_vendor_read" ON vendors;
DROP POLICY IF EXISTS "enable_vendor_write" ON vendors;

-- Create a secure view for admin access checks
CREATE OR REPLACE VIEW admin_access AS
SELECT id
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'admin';

-- Create simplified policies for users table
CREATE POLICY "allow_read_access"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Create simplified policies for vendors table
CREATE POLICY "allow_vendor_read"
  ON vendors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_vendor_write"
  ON vendors
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM admin_access WHERE id = auth.uid())
  );

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON admin_access TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON vendors TO authenticated;