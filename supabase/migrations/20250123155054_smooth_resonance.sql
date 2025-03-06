-- Drop existing problematic policies
DO $$ 
BEGIN
  -- Drop users policies
  DROP POLICY IF EXISTS "enable_select_for_authenticated" ON users;
  DROP POLICY IF EXISTS "enable_update_for_self" ON users;
  
  -- Drop vendors policies
  DROP POLICY IF EXISTS "enable_select_for_all" ON vendors;
  DROP POLICY IF EXISTS "enable_insert_for_self" ON vendors;
  DROP POLICY IF EXISTS "enable_update_for_self" ON vendors;
  
  -- Drop couples policies
  DROP POLICY IF EXISTS "enable_select_for_all" ON couples;
  DROP POLICY IF EXISTS "enable_insert_for_self" ON couples;
  DROP POLICY IF EXISTS "enable_update_for_self" ON couples;
END $$;

-- Create new simplified policies without recursion

-- Users table - Allow public read and authenticated users to manage their own data
CREATE POLICY "allow_public_read_users"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "allow_auth_insert_users"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "allow_auth_update_users"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Vendors table - Allow public read and authenticated users to manage their own data
CREATE POLICY "allow_public_read_vendors"
  ON vendors FOR SELECT
  USING (true);

CREATE POLICY "allow_auth_insert_vendors"
  ON vendors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_auth_update_vendors"
  ON vendors FOR UPDATE
  USING (auth.uid() = user_id);

-- Couples table - Allow public read and authenticated users to manage their own data
CREATE POLICY "allow_public_read_couples"
  ON couples FOR SELECT
  USING (true);

CREATE POLICY "allow_auth_insert_couples"
  ON couples FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_auth_update_couples"
  ON couples FOR UPDATE
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