-- Drop existing vendor policies
DROP POLICY IF EXISTS "vendors_select" ON vendors;
DROP POLICY IF EXISTS "vendors_write" ON vendors;

-- Create more permissive vendor policies
CREATE POLICY "vendors_select"
  ON vendors
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create vendors
CREATE POLICY "vendors_insert"
  ON vendors
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to update their own vendor profiles
CREATE POLICY "vendors_update"
  ON vendors
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Allow users to delete their own vendor profiles
CREATE POLICY "vendors_delete"
  ON vendors
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Ensure RLS is enabled
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON vendors TO authenticated;