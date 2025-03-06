-- Drop existing policies
DROP POLICY IF EXISTS "users_read" ON users;
DROP POLICY IF EXISTS "users_write" ON users;
DROP POLICY IF EXISTS "vendors_read" ON vendors;
DROP POLICY IF EXISTS "vendors_write" ON vendors;
DROP POLICY IF EXISTS "couples_read" ON couples;
DROP POLICY IF EXISTS "couples_write" ON couples;

-- Create simplified policies for users table
CREATE POLICY "allow_read_users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_insert_users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "allow_update_users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create simplified policies for vendors table
CREATE POLICY "allow_read_vendors"
  ON vendors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_insert_vendors"
  ON vendors
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_update_vendors"
  ON vendors
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create simplified policies for couples table
CREATE POLICY "allow_read_couples"
  ON couples
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_insert_couples"
  ON couples
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_update_couples"
  ON couples
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;