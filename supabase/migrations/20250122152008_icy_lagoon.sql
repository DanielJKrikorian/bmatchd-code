-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read own data and admins can read all" ON users;
DROP POLICY IF EXISTS "Users can update own data and admins can update all" ON users;
DROP POLICY IF EXISTS "Vendors can manage own data and admins can manage all" ON vendors;
DROP POLICY IF EXISTS "Couples can read own data and admins can read all" ON couples;
DROP POLICY IF EXISTS "Couples can manage own data and admins can manage all" ON couples;

-- Create non-recursive policies for users table
CREATE POLICY "Enable read access for users"
  ON users FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "Enable update for users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid() OR
    auth.jwt()->>'role' = 'admin'
  )
  WITH CHECK (
    id = auth.uid() OR
    auth.jwt()->>'role' = 'admin'
  );

-- Update vendors policies
CREATE POLICY "Enable read access for vendors"
  ON vendors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable write access for vendors"
  ON vendors FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    auth.jwt()->>'role' = 'admin'
  )
  WITH CHECK (
    user_id = auth.uid() OR
    auth.jwt()->>'role' = 'admin'
  );

-- Update couples policies
CREATE POLICY "Enable read access for couples"
  ON couples FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "Enable write access for couples"
  ON couples FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    auth.jwt()->>'role' = 'admin'
  )
  WITH CHECK (
    user_id = auth.uid() OR
    auth.jwt()->>'role' = 'admin'
  );