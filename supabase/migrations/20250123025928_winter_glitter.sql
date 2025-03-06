-- Drop all existing policies
DROP POLICY IF EXISTS "allow_read_users" ON users;
DROP POLICY IF EXISTS "allow_update_users" ON users;
DROP POLICY IF EXISTS "allow_read_vendors" ON vendors;
DROP POLICY IF EXISTS "allow_insert_vendors" ON vendors;
DROP POLICY IF EXISTS "allow_update_vendors" ON vendors;
DROP POLICY IF EXISTS "allow_delete_vendors" ON vendors;

-- Create base policies for users table
CREATE POLICY "enable_select_for_users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "enable_insert_for_users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "enable_update_for_users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create base policies for vendors table
CREATE POLICY "enable_select_for_vendors"
  ON vendors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "enable_insert_for_vendors"
  ON vendors
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "enable_update_for_vendors"
  ON vendors
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "enable_delete_for_vendors"
  ON vendors
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for vendor service areas
CREATE POLICY "enable_all_for_service_areas"
  ON vendor_service_areas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE id = vendor_service_areas.vendor_id
      AND user_id = auth.uid()
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