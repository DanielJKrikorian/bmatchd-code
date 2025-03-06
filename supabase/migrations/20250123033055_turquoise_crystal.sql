-- Drop all existing policies
DROP POLICY IF EXISTS "basic_read_policy" ON users;
DROP POLICY IF EXISTS "basic_write_policy" ON users;
DROP POLICY IF EXISTS "basic_vendor_read" ON vendors;
DROP POLICY IF EXISTS "basic_vendor_write" ON vendors;
DROP POLICY IF EXISTS "basic_service_areas" ON vendor_service_areas;

-- Create minimal policies for users table
CREATE POLICY "anon_select"
  ON users
  FOR SELECT
  USING (true);

-- Create minimal policies for vendors table
CREATE POLICY "vendor_select"
  ON vendors
  FOR SELECT
  USING (true);

CREATE POLICY "vendor_insert"
  ON vendors
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "vendor_update"
  ON vendors
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "vendor_delete"
  ON vendors
  FOR DELETE
  USING (user_id = auth.uid());

-- Create minimal policy for service areas
CREATE POLICY "service_areas_all"
  ON vendor_service_areas
  FOR ALL
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