-- Drop existing policies
DROP POLICY IF EXISTS "enable_insert_views" ON vendor_profile_views;
DROP POLICY IF EXISTS "enable_vendor_read_views" ON vendor_profile_views;

-- Create simplified policies for vendor profile views
CREATE POLICY "allow_insert_views"
  ON vendor_profile_views
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "allow_vendor_read_views"
  ON vendor_profile_views
  FOR SELECT
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendors
      WHERE user_id = auth.uid()
    )
  );

-- Create policy for anonymous users to insert views
CREATE POLICY "allow_anon_insert_views"
  ON vendor_profile_views
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Grant necessary permissions
GRANT INSERT ON vendor_profile_views TO anon;
GRANT INSERT ON vendor_profile_views TO authenticated;
GRANT SELECT ON vendor_profile_views TO authenticated;

-- Add comment to document the change
COMMENT ON TABLE vendor_profile_views IS 'Tracks vendor profile views with proper RLS policies';