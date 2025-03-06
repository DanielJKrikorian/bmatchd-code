/*
  # Fix RLS Policies

  1. Changes
    - Drop existing recursive policies
    - Create new non-recursive policies using auth.uid() directly
    - Simplify policy checks to avoid recursion
    - Maintain proper access control for all user types

  2. Security
    - Maintain proper access control for users, vendors, and couples
    - Use direct auth.uid() checks instead of recursive subqueries
    - Preserve admin access while avoiding recursion

  3. Notes
    - Policies are simplified but maintain same security level
    - Uses direct auth checks to prevent recursion
    - Maintains existing functionality with better performance
*/

-- Drop existing policies safely
DO $$ 
BEGIN
  -- Drop users policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Basic read access for users' AND tablename = 'users') THEN
    DROP POLICY "Basic read access for users" ON users;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Basic update access for users' AND tablename = 'users') THEN
    DROP POLICY "Basic update access for users" ON users;
  END IF;

  -- Drop vendors policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Basic read access for vendors' AND tablename = 'vendors') THEN
    DROP POLICY "Basic read access for vendors" ON vendors;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Basic write access for vendors' AND tablename = 'vendors') THEN
    DROP POLICY "Basic write access for vendors" ON vendors;
  END IF;

  -- Drop couples policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Basic read access for couples' AND tablename = 'couples') THEN
    DROP POLICY "Basic read access for couples" ON couples;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Basic write access for couples' AND tablename = 'couples') THEN
    DROP POLICY "Basic write access for couples" ON couples;
  END IF;
END $$;

-- Create simplified non-recursive policies for users table
CREATE POLICY "Allow users to read own data"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Allow users to update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Allow admin read access"
  ON users FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Allow admin write access"
  ON users FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

-- Create simplified policies for vendors table
CREATE POLICY "Allow public read access to vendors"
  ON vendors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow vendors to manage own data"
  ON vendors FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow admin to manage vendors"
  ON vendors FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

-- Create simplified policies for couples table
CREATE POLICY "Allow couples to read own data"
  ON couples FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Allow couples to manage own data"
  ON couples FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow admin to manage couples"
  ON couples FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;