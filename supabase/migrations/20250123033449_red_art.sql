-- Drop existing policies
DROP POLICY IF EXISTS "anon_select" ON users;
DROP POLICY IF EXISTS "vendor_select" ON vendors;
DROP POLICY IF EXISTS "vendor_insert" ON vendors;
DROP POLICY IF EXISTS "vendor_update" ON vendors;
DROP POLICY IF EXISTS "vendor_delete" ON vendors;
DROP POLICY IF EXISTS "service_areas_all" ON vendor_service_areas;

-- Create simple read-only policy for users
CREATE POLICY "allow_read_users"
  ON users
  FOR SELECT
  USING (true);

-- Create simple vendor policies
CREATE POLICY "allow_read_vendors"
  ON vendors
  FOR SELECT
  USING (true);

CREATE POLICY "allow_manage_vendors"
  ON vendors
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create simple service areas policy
CREATE POLICY "allow_manage_service_areas"
  ON vendor_service_areas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors 
      WHERE id = vendor_service_areas.vendor_id 
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
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