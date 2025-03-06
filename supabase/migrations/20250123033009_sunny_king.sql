-- Drop existing problematic policies
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "vendors_read_policy" ON vendors;
DROP POLICY IF EXISTS "vendors_insert_policy" ON vendors;
DROP POLICY IF EXISTS "vendors_update_policy" ON vendors;
DROP POLICY IF EXISTS "vendors_delete_policy" ON vendors;
DROP POLICY IF EXISTS "service_areas_policy" ON vendor_service_areas;

-- Create extremely simple policies without any recursion
CREATE POLICY "basic_read_policy"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "basic_write_policy"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Simple vendor policies
CREATE POLICY "basic_vendor_read"
  ON vendors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "basic_vendor_write"
  ON vendors
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Simple service areas policy
CREATE POLICY "basic_service_areas"
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