-- Drop existing policies for reviews table
DROP POLICY IF EXISTS "read_reviews" ON reviews;
DROP POLICY IF EXISTS "allow_public_read_reviews" ON reviews;
DROP POLICY IF EXISTS "allow_couple_write_reviews" ON reviews;

-- Create new simplified policies for reviews table
CREATE POLICY "enable_read_reviews"
  ON reviews
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "enable_insert_reviews"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE id = couple_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "enable_update_reviews"
  ON reviews
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE id = vendor_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE id = vendor_id
      AND user_id = auth.uid()
    )
  );

-- Ensure RLS is enabled
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON reviews TO authenticated;