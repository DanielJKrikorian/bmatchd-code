/*
  # Update saved_vendors table policies

  1. Changes
    - Drop existing policies
    - Add new policies for couples to manage their saved vendors
    - Add policy for vendors to view who saved them
  
  2. Security
    - Enable RLS
    - Ensure couples can only manage their own saved vendors
    - Allow vendors to view who saved them
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Couples can manage their saved vendors" ON saved_vendors;

-- Enable RLS
ALTER TABLE saved_vendors ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Couples can read their saved vendors"
  ON saved_vendors
  FOR SELECT
  TO authenticated
  USING (
    couple_id IN (
      SELECT id FROM couples WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Couples can add saved vendors"
  ON saved_vendors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    couple_id IN (
      SELECT id FROM couples WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Couples can remove saved vendors"
  ON saved_vendors
  FOR DELETE
  TO authenticated
  USING (
    couple_id IN (
      SELECT id FROM couples WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can view who saved them"
  ON saved_vendors
  FOR SELECT
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );