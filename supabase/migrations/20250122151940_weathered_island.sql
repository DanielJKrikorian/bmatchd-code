-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read own data and admins can read all" ON users;
DROP POLICY IF EXISTS "Users can update own data and admins can update all" ON users;
DROP POLICY IF EXISTS "Vendors can manage own data and admins can manage all" ON vendors;
DROP POLICY IF EXISTS "Couples can read own data and admins can read all" ON couples;
DROP POLICY IF EXISTS "Couples can manage own data and admins can manage all" ON couples;

-- Create new RLS policies for users table
CREATE POLICY "Users can read own data and admins can read all"
  ON users FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own data and admins can update all"
  ON users FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Update vendors policies
CREATE POLICY "Vendors can manage own data and admins can manage all"
  ON vendors FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Update couples policies
CREATE POLICY "Couples can read own data and admins can read all"
  ON couples FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Couples can manage own data and admins can manage all"
  ON couples FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );