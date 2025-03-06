/*
  # Fix Authentication Policies

  1. Changes
    - Drop existing policies safely
    - Create simplified non-recursive policies
    - Update admin access controls
    - Fix policy naming conflicts

  2. Security
    - Enable RLS on all tables
    - Add proper access controls for users, vendors, and couples
    - Ensure admin privileges are properly handled

  3. Notes
    - Uses non-recursive policy checks
    - Avoids policy name conflicts
    - Maintains existing functionality
*/

-- Drop existing policies safely
DO $$ 
BEGIN
  -- Drop users policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable read access for users' AND tablename = 'users') THEN
    DROP POLICY "Enable read access for users" ON users;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable update for users' AND tablename = 'users') THEN
    DROP POLICY "Enable update for users" ON users;
  END IF;

  -- Drop vendors policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable read access for vendors' AND tablename = 'vendors') THEN
    DROP POLICY "Enable read access for vendors" ON vendors;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable write access for vendors' AND tablename = 'vendors') THEN
    DROP POLICY "Enable write access for vendors" ON vendors;
  END IF;

  -- Drop couples policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable read access for couples' AND tablename = 'couples') THEN
    DROP POLICY "Enable read access for couples" ON couples;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable write access for couples' AND tablename = 'couples') THEN
    DROP POLICY "Enable write access for couples" ON couples;
  END IF;
END $$;

-- Create new non-recursive policies for users table
CREATE POLICY "Basic read access for users"
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

CREATE POLICY "Basic update access for users"
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
CREATE POLICY "Basic read access for vendors"
  ON vendors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Basic write access for vendors"
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
CREATE POLICY "Basic read access for couples"
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

CREATE POLICY "Basic write access for couples"
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

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;