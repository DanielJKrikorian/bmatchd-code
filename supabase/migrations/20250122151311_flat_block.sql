/*
  # Fix RLS Policies

  1. Changes
    - Removes recursive policies
    - Implements proper role-based access control
    - Fixes infinite recursion in user policies

  2. Security
    - Maintains proper access control
    - Prevents policy recursion
    - Ensures data integrity
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins have full access" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create new non-recursive policies for users table
CREATE POLICY "Enable read access for authenticated users"
  ON users FOR SELECT
  TO authenticated
  USING (
    CASE
      WHEN auth.jwt()->>'role' = 'authenticated' THEN
        id = auth.uid() OR
        EXISTS (
          SELECT 1
          FROM auth.users au
          WHERE au.id = auth.uid()
          AND (au.raw_user_meta_data->>'role')::text = 'admin'
        )
      ELSE false
    END
  );

CREATE POLICY "Enable update for users on own record"
  ON users FOR UPDATE
  TO authenticated
  USING (
    CASE
      WHEN auth.jwt()->>'role' = 'authenticated' THEN
        id = auth.uid() OR
        EXISTS (
          SELECT 1
          FROM auth.users au
          WHERE au.id = auth.uid()
          AND (au.raw_user_meta_data->>'role')::text = 'admin'
        )
      ELSE false
    END
  )
  WITH CHECK (
    CASE
      WHEN auth.jwt()->>'role' = 'authenticated' THEN
        id = auth.uid() OR
        EXISTS (
          SELECT 1
          FROM auth.users au
          WHERE au.id = auth.uid()
          AND (au.raw_user_meta_data->>'role')::text = 'admin'
        )
      ELSE false
    END
  );

-- Update vendors policies
DROP POLICY IF EXISTS "Admins have full access to vendors" ON vendors;

CREATE POLICY "Enable read access for all authenticated users"
  ON vendors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable write access for vendors and admins"
  ON vendors FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1
      FROM auth.users au
      WHERE au.id = auth.uid()
      AND (au.raw_user_meta_data->>'role')::text = 'admin'
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1
      FROM auth.users au
      WHERE au.id = auth.uid()
      AND (au.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

-- Update couples policies
DROP POLICY IF EXISTS "Admins have full access to couples" ON couples;
DROP POLICY IF EXISTS "Couples can read own data" ON couples;
DROP POLICY IF EXISTS "Couples can update own data" ON couples;

CREATE POLICY "Enable read access for couples"
  ON couples FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1
      FROM auth.users au
      WHERE au.id = auth.uid()
      AND (au.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

CREATE POLICY "Enable write access for couples and admins"
  ON couples FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1
      FROM auth.users au
      WHERE au.id = auth.uid()
      AND (au.raw_user_meta_data->>'role')::text = 'admin'
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1
      FROM auth.users au
      WHERE au.id = auth.uid()
      AND (au.raw_user_meta_data->>'role')::text = 'admin'
    )
  );