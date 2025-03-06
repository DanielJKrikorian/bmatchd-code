/*
  # Admin User and Policies Migration

  1. Changes
    - Updates RLS policies for better security
    - Fixes recursive policy issues
    - Removes admin user creation (handled in separate migration)

  2. Security
    - Implements secure role-based policies
    - Prevents unauthorized access
    - Uses proper auth checks
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins have full access" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users on own record" ON users;

-- Create new RLS policies for users table
CREATE POLICY "Users can read own data and admins can read all"
  ON users FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_user_meta_data->>'role')::text = 'admin'
    )
  );

CREATE POLICY "Users can update own data and admins can update all"
  ON users FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_user_meta_data->>'role')::text = 'admin'
    )
  )
  WITH CHECK (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_user_meta_data->>'role')::text = 'admin'
    )
  );

-- Update vendors policies
DROP POLICY IF EXISTS "Admins have full access to vendors" ON vendors;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON vendors;
DROP POLICY IF EXISTS "Enable write access for vendors and admins" ON vendors;

CREATE POLICY "Anyone can read vendors"
  ON vendors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Vendors can manage own data and admins can manage all"
  ON vendors FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_user_meta_data->>'role')::text = 'admin'
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_user_meta_data->>'role')::text = 'admin'
    )
  );

-- Update couples policies
DROP POLICY IF EXISTS "Admins have full access to couples" ON couples;
DROP POLICY IF EXISTS "Enable read access for couples" ON couples;
DROP POLICY IF EXISTS "Enable write access for couples and admins" ON couples;

CREATE POLICY "Couples can read own data and admins can read all"
  ON couples FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_user_meta_data->>'role')::text = 'admin'
    )
  );

CREATE POLICY "Couples can manage own data and admins can manage all"
  ON couples FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_user_meta_data->>'role')::text = 'admin'
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_user_meta_data->>'role')::text = 'admin'
    )
  );