-- Drop existing policies
DROP POLICY IF EXISTS "Vendors can view their own activities" ON vendor_activities;

-- Create new policies for vendor_activities table
CREATE POLICY "enable_read_vendor_activities"
  ON vendor_activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE id = vendor_activities.vendor_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "enable_insert_vendor_activities"
  ON vendor_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE id = vendor_activities.vendor_id
      AND user_id = auth.uid()
    )
  );

-- Ensure RLS is enabled
ALTER TABLE vendor_activities ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON vendor_activities TO authenticated;