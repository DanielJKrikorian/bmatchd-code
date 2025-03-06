-- Drop existing policies
DROP POLICY IF EXISTS "public_read_access" ON users;
DROP POLICY IF EXISTS "authenticated_user_access" ON users;

-- Create simplified policies
CREATE POLICY "allow_public_read"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_user_write"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_user_update"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create separate vendor policies
CREATE POLICY "allow_vendor_read"
  ON vendors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_vendor_write"
  ON vendors
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON vendors TO authenticated;