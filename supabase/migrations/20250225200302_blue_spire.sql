-- Drop existing policies for vendor_service_areas
DROP POLICY IF EXISTS "enable_read_for_all" ON vendor_service_areas;
DROP POLICY IF EXISTS "enable_write_for_vendors" ON vendor_service_areas;
DROP POLICY IF EXISTS "enable_delete_for_vendors" ON vendor_service_areas;

-- Create new simplified policy for vendor_service_areas
CREATE POLICY "allow_vendor_access"
  ON vendor_service_areas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = vendor_service_areas.vendor_id
      AND v.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = vendor_service_areas.vendor_id
      AND v.user_id = auth.uid()
    )
  );

-- Create policy for public read access
CREATE POLICY "allow_public_read"
  ON vendor_service_areas
  FOR SELECT
  USING (true);

-- Ensure RLS is enabled
ALTER TABLE vendor_service_areas ENABLE ROW LEVEL SECURITY;

-- Add comment to document the changes
COMMENT ON TABLE vendor_service_areas IS 'Stores vendor service area mappings with proper RLS policies';