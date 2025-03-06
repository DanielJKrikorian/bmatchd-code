-- Drop existing review policies
DROP POLICY IF EXISTS "enable_read_reviews" ON reviews;
DROP POLICY IF EXISTS "enable_insert_reviews" ON reviews;
DROP POLICY IF EXISTS "enable_update_reviews" ON reviews;

-- Create policy for public read access
CREATE POLICY "allow_read_reviews"
  ON reviews
  FOR SELECT
  USING (true);

-- Create policy for couples to write reviews
CREATE POLICY "allow_couples_write_reviews"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE id = couple_id
      AND user_id = auth.uid()
      -- Only allow reviews for vendors they've had appointments with
      AND EXISTS (
        SELECT 1 FROM appointments
        WHERE couple_id = reviews.couple_id
        AND vendor_id = reviews.vendor_id
        AND status = 'confirmed'
      )
    )
  );

-- Create policy for vendors to respond to reviews
CREATE POLICY "allow_vendors_respond_reviews"
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_couple_vendor ON reviews(couple_id, vendor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Add comment to document the policies
COMMENT ON TABLE reviews IS 'Reviews from couples for vendors with response capability';