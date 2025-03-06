-- Drop existing vendor policies
DROP POLICY IF EXISTS "vendors_read_policy" ON vendors;
DROP POLICY IF EXISTS "vendors_write_policy" ON vendors;
DROP POLICY IF EXISTS "enable_read_access" ON vendors;
DROP POLICY IF EXISTS "enable_write_access" ON vendors;
DROP POLICY IF EXISTS "allow_vendor_read" ON vendors;
DROP POLICY IF EXISTS "allow_vendor_write" ON vendors;

-- Create simplified policies for vendors table
CREATE POLICY "enable_vendor_read"
  ON vendors
  FOR SELECT
  USING (true);

CREATE POLICY "enable_vendor_write"
  ON vendors
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Grant necessary permissions
GRANT ALL ON vendors TO authenticated;

-- Add comment to document the changes
COMMENT ON TABLE vendors IS 'Vendor profiles with simplified RLS policies';