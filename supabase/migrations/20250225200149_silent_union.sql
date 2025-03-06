-- Drop existing policies for vendor_service_areas
DROP POLICY IF EXISTS "enable_write_access" ON vendor_service_areas;
DROP POLICY IF EXISTS "enable_all_for_vendor" ON vendor_service_areas;
DROP POLICY IF EXISTS "service_areas_policy" ON vendor_service_areas;

-- Create new policies for vendor_service_areas
CREATE POLICY "enable_read_for_all"
  ON vendor_service_areas
  FOR SELECT
  USING (true);

CREATE POLICY "enable_write_for_vendors"
  ON vendor_service_areas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = vendor_service_areas.vendor_id
      AND v.user_id = auth.uid()
    )
  );

CREATE POLICY "enable_delete_for_vendors"
  ON vendor_service_areas
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = vendor_service_areas.vendor_id
      AND v.user_id = auth.uid()
    )
  );

-- Add comment to document the changes
COMMENT ON TABLE vendor_service_areas IS 'Stores vendor service area mappings with proper RLS policies';