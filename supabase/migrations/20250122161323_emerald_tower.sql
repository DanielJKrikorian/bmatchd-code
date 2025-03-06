-- Drop existing policies
DROP POLICY IF EXISTS "allow_read_access" ON users;
DROP POLICY IF EXISTS "allow_admin_full_access" ON users;

-- Create new non-recursive policies
CREATE POLICY "basic_read_access"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    auth.jwt()->>'role' = 'authenticated'
  );

CREATE POLICY "basic_write_access"
  ON users
  FOR ALL
  TO authenticated
  USING (
    id = auth.uid() OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;