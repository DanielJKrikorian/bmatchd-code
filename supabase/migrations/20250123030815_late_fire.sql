-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "vendors_read_policy" ON vendors;
DROP POLICY IF EXISTS "vendors_insert_policy" ON vendors;
DROP POLICY IF EXISTS "vendors_update_policy" ON vendors;
DROP POLICY IF EXISTS "vendors_delete_policy" ON vendors;
DROP POLICY IF EXISTS "service_areas_policy" ON vendor_service_areas;

-- Create simplified non-recursive policies for users table
CREATE POLICY "users_read_policy"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_insert_policy"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "users_update_policy"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create simplified non-recursive policies for vendors table
CREATE POLICY "vendors_read_policy"
  ON vendors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "vendors_write_policy"
  ON vendors
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create simplified policy for vendor service areas
CREATE POLICY "service_areas_policy"
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