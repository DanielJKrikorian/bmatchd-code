-- Drop all existing policies
DROP POLICY IF EXISTS "enable_read_access" ON users;
DROP POLICY IF EXISTS "enable_insert_access" ON users;
DROP POLICY IF EXISTS "enable_update_access" ON users;
DROP POLICY IF EXISTS "enable_vendor_read" ON vendors;
DROP POLICY IF EXISTS "enable_vendor_write" ON vendors;
DROP POLICY IF EXISTS "enable_service_areas" ON vendor_service_areas;
DROP FUNCTION IF EXISTS auth_user_id;

-- Create bare minimum policies for users table
CREATE POLICY "allow_read"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_insert"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create bare minimum policies for vendors table
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

-- Create bare minimum policy for service areas
CREATE POLICY "allow_service_areas"
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