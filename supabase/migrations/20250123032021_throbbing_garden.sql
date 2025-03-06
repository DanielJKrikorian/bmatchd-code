-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "vendors_read_policy" ON vendors;
DROP POLICY IF EXISTS "vendors_write_policy" ON vendors;
DROP POLICY IF EXISTS "service_areas_policy" ON vendor_service_areas;

-- Create simple non-recursive policy for users table
CREATE POLICY "allow_auth_operations"
  ON users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create simple policies for vendors table
CREATE POLICY "allow_vendor_read"
  ON vendors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_vendor_write"
  ON vendors
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create simple policy for vendor service areas
CREATE POLICY "allow_service_areas"
  ON vendor_service_areas
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM vendors 
    WHERE id = vendor_service_areas.vendor_id 
    AND user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM vendors 
    WHERE id = vendor_service_areas.vendor_id 
    AND user_id = auth.uid()
  ));

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_service_areas ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;