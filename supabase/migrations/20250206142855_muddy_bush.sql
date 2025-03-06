-- Drop existing vendor policies
DROP POLICY IF EXISTS "allow_all_vendors" ON vendors;

-- Create simplified policies for vendors table
CREATE POLICY "vendor_read_policy"
  ON vendors
  FOR SELECT
  USING (true);

CREATE POLICY "vendor_write_policy"
  ON vendors
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON vendors TO authenticated;
GRANT SELECT ON vendors TO anon;

-- Add comment to document the changes
COMMENT ON TABLE vendors IS 'Vendor profiles with simplified access policies';