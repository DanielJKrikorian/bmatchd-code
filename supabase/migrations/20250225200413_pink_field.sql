-- Drop existing policies for vendor_service_areas
DROP POLICY IF EXISTS "allow_vendor_access" ON vendor_service_areas;
DROP POLICY IF EXISTS "allow_public_read" ON vendor_service_areas;

-- Create maximally permissive policy for vendor_service_areas
CREATE POLICY "enable_all_access"
  ON vendor_service_areas
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE vendor_service_areas ENABLE ROW LEVEL SECURITY;

-- Add comment to document the changes
COMMENT ON TABLE vendor_service_areas IS 'Stores vendor service area mappings with permissive RLS policy';