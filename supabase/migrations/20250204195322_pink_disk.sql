-- Drop existing problematic policies
DROP POLICY IF EXISTS "enable_admin_access" ON users;
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "users_write_policy" ON users;
DROP POLICY IF EXISTS "enable_read_access" ON users;
DROP POLICY IF EXISTS "enable_write_access" ON users;

-- Create simplified non-recursive policies
CREATE POLICY "allow_read_access"
  ON users
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "allow_update_self"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create policy for admin write access without recursion
CREATE POLICY "allow_admin_write"
  ON users
  FOR ALL 
  TO authenticated
  USING (
    -- Check raw_user_meta_data directly from auth.users
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_user_meta_data->>'role')::text = 'admin'
    )
  );

-- Add comment to document the changes
COMMENT ON TABLE users IS 'User profiles with non-recursive RLS policies';