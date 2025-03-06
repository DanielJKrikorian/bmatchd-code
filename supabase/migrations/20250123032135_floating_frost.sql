-- Drop all existing policies
DROP POLICY IF EXISTS "allow_auth_operations" ON users;
DROP POLICY IF EXISTS "allow_vendor_read" ON vendors;
DROP POLICY IF EXISTS "allow_vendor_write" ON vendors;
DROP POLICY IF EXISTS "allow_service_areas" ON vendor_service_areas;

-- Create a secure function to check auth status
CREATE OR REPLACE FUNCTION auth_user_id() 
RETURNS uuid 
LANGUAGE sql 
STABLE
AS $$
  SELECT COALESCE(auth.uid(), NULL);
$$;

-- Create simplified policies for users table
CREATE POLICY "enable_read_access"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "enable_insert_access"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id() IS NOT NULL);

CREATE POLICY "enable_update_access"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth_user_id());

-- Create simplified policies for vendors table
CREATE POLICY "enable_vendor_read"
  ON vendors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "enable_vendor_write"
  ON vendors
  FOR ALL
  TO authenticated
  USING (user_id = auth_user_id())
  WITH CHECK (user_id = auth_user_id());

-- Create simplified policy for service areas
CREATE POLICY "enable_service_areas"
  ON vendor_service_areas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors 
      WHERE id = vendor_service_areas.vendor_id 
      AND user_id = auth_user_id()
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
GRANT EXECUTE ON FUNCTION auth_user_id TO authenticated;