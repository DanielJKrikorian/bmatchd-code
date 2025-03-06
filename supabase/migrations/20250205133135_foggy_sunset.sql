-- Drop existing problematic policies
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_write_policy" ON users;
DROP POLICY IF EXISTS "enable_read_access" ON users;
DROP POLICY IF EXISTS "enable_write_access" ON users;

-- Create simplified policies for users table
CREATE POLICY "allow_select_users"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "allow_write_users"
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

-- Ensure proper permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth ON users(id, role);
CREATE INDEX IF NOT EXISTS idx_auth_users_meta ON auth.users((raw_user_meta_data->>'role'));