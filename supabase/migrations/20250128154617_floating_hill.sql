-- Drop existing policies if they exist
DROP POLICY IF EXISTS "enable_delete_for_self" ON users;
DROP POLICY IF EXISTS "enable_delete_for_self" ON vendors;

-- Create policy to allow users to delete their own records
CREATE POLICY "enable_delete_for_self"
  ON users
  FOR DELETE
  TO authenticated
  USING (id = auth.uid());

-- Create policy to allow vendors to delete their own records
CREATE POLICY "enable_delete_for_self"
  ON vendors
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add comment to document the policies
COMMENT ON POLICY "enable_delete_for_self" ON users IS 'Allow users to delete their own records';
COMMENT ON POLICY "enable_delete_for_self" ON vendors IS 'Allow vendors to delete their own records';