/*
  # Fix RLS policies for couples table

  1. Changes
    - Add policy for couples to insert their own data
    - Update existing policies to be more specific
    - Add policy for couples to update their own data

  2. Security
    - Enable RLS on couples table
    - Policies ensure users can only access and modify their own data
*/

-- Enable RLS for couples table
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Couples can read own data" ON couples;
DROP POLICY IF EXISTS "Couples can update own data" ON couples;
DROP POLICY IF EXISTS "Couples can insert own data" ON couples;

-- Create new policies
CREATE POLICY "Couples can read own data"
  ON couples
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Couples can update own data"
  ON couples
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Couples can insert own data"
  ON couples
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);