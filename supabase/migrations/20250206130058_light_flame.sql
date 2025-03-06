-- Drop existing vendor policies
DROP POLICY IF EXISTS "enable_vendor_read" ON vendors;
DROP POLICY IF EXISTS "enable_vendor_write" ON vendors;

-- Create simplified policies for vendors table
CREATE POLICY "vendor_access_policy"
  ON vendors
  FOR ALL
  TO authenticated
  USING (
    -- Allow vendors to access their own records
    user_id = auth.uid() OR
    -- Allow admins to access all records
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    -- Allow vendors to modify their own records
    user_id = auth.uid() OR
    -- Allow admins to modify all records
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create policy for public read access
CREATE POLICY "vendor_public_read_policy"
  ON vendors
  FOR SELECT
  USING (true);

-- Ensure RLS is enabled
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON vendors TO authenticated;
GRANT SELECT ON vendors TO anon;

-- Add comment to document the changes
COMMENT ON TABLE vendors IS 'Vendor profiles with proper RLS policies';