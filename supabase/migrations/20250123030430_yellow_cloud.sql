-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "enable_select_for_users" ON users;
DROP POLICY IF EXISTS "enable_insert_for_users" ON users;
DROP POLICY IF EXISTS "enable_update_for_users" ON users;
DROP POLICY IF EXISTS "enable_select_for_vendors" ON vendors;
DROP POLICY IF EXISTS "enable_insert_for_vendors" ON vendors;
DROP POLICY IF EXISTS "enable_update_for_vendors" ON vendors;
DROP POLICY IF EXISTS "enable_delete_for_vendors" ON vendors;
DROP POLICY IF EXISTS "enable_all_for_service_areas" ON vendor_service_areas;

-- Create simplified policies for users table
CREATE POLICY "users_read_policy"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_insert_policy"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "users_update_policy"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create simplified policies for vendors table
CREATE POLICY "vendors_read_policy"
  ON vendors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "vendors_insert_policy"
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

-- Create simplified policy for vendor service areas
CREATE POLICY "service_areas_policy"
  ON vendor_service_areas
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM vendors WHERE id = vendor_service_areas.vendor_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM vendors WHERE id = vendor_service_areas.vendor_id
    )
  );

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_service_areas ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;