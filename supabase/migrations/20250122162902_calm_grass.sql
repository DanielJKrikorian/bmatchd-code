-- Drop all existing policies and views
DROP POLICY IF EXISTS "allow_read_access" ON users;
DROP POLICY IF EXISTS "allow_vendor_read" ON vendors;
DROP POLICY IF EXISTS "allow_vendor_write" ON vendors;
DROP VIEW IF EXISTS admin_access;

-- Create a secure function to check admin status
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create simplified policies for vendors table
CREATE POLICY "vendor_read_policy"
  ON vendors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "vendor_write_policy"
  ON vendors
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    is_admin()
  );

-- Create simplified policies for users table
CREATE POLICY "user_read_policy"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "user_write_policy"
  ON users
  FOR ALL
  TO authenticated
  USING (is_admin());

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON vendors TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;