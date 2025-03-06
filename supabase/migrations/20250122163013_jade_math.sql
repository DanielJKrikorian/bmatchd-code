-- Drop all existing policies and functions
DROP POLICY IF EXISTS "vendor_read_policy" ON vendors;
DROP POLICY IF EXISTS "vendor_write_policy" ON vendors;
DROP POLICY IF EXISTS "user_read_policy" ON users;
DROP POLICY IF EXISTS "user_write_policy" ON users;
DROP FUNCTION IF EXISTS is_admin();

-- Create a secure function to check admin status that avoids recursion
CREATE OR REPLACE FUNCTION auth_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create non-recursive policies for vendors table
CREATE POLICY "vendor_select_policy"
  ON vendors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "vendor_all_policy"
  ON vendors
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    auth_is_admin()
  )
  WITH CHECK (
    user_id = auth.uid() OR
    auth_is_admin()
  );

-- Create non-recursive policies for users table
CREATE POLICY "user_select_policy"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "user_all_policy"
  ON users
  FOR ALL
  TO authenticated
  USING (
    id = auth.uid() OR
    auth_is_admin()
  )
  WITH CHECK (
    id = auth.uid() OR
    auth_is_admin()
  );

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON vendors TO authenticated;
GRANT EXECUTE ON FUNCTION auth_is_admin() TO authenticated;