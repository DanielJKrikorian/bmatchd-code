/*
  # Add Review Response Feature

  1. Changes
    - Add response column to reviews table
    - Add response_date column to track when vendors respond
    - Enable RLS policies for vendor responses

  2. Security
    - Only vendors can update their own reviews with responses
    - Anyone can read review responses
*/

-- Add response columns to reviews table
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS response text,
ADD COLUMN IF NOT EXISTS response_date timestamptz;

-- Create policy for vendors to update their reviews with responses
CREATE POLICY "Vendors can respond to their reviews"
  ON reviews
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE id = reviews.vendor_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE id = reviews.vendor_id
      AND user_id = auth.uid()
    )
  );