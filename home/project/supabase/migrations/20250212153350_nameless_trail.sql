-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "auth_policy_v4" ON users;
  DROP POLICY IF EXISTS "enable_access" ON users;
END $$;

-- Create new policies
CREATE POLICY "users_read_policy"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "users_write_policy"
  ON users
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Add comment to document the changes
COMMENT ON TABLE users IS 'User profiles with proper RLS policies';