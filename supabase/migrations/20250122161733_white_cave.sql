-- Drop existing policies
DROP POLICY IF EXISTS "allow_user_read" ON users;
DROP POLICY IF EXISTS "allow_user_write" ON users;

-- Create new public read policy for admin dashboard
CREATE POLICY "public_read_access"
  ON users
  FOR SELECT
  TO anon
  USING (true);

-- Create policy for authenticated users to manage their own data
CREATE POLICY "authenticated_user_access"
  ON users
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = id OR
    role = 'admin'
  );

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;