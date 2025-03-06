-- Drop existing policies
DROP POLICY IF EXISTS "vendor_select_policy" ON vendors;
DROP POLICY IF EXISTS "vendor_modify_policy" ON vendors;
DROP POLICY IF EXISTS "user_select_policy" ON users;
DROP POLICY IF EXISTS "user_modify_policy" ON users;

-- Create simplified policies for vendors table
CREATE POLICY "vendor_select_policy"
  ON vendors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "vendor_modify_policy"
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

-- Create simplified policies for users table
CREATE POLICY "user_select_policy"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "user_modify_policy"
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

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON vendors TO authenticated;
GRANT ALL ON users TO authenticated;