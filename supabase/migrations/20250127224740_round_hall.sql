-- Drop existing problematic views and functions
DROP VIEW IF EXISTS vendor_messages CASCADE;
DROP VIEW IF EXISTS message_details CASCADE;
DROP FUNCTION IF EXISTS check_message_access CASCADE;

-- Create a secure view for message threads with vendor details
CREATE OR REPLACE VIEW thread_messages AS
SELECT 
  m.*,
  mt.vendor_id,
  mt.couple_id,
  v.business_name as vendor_business_name,
  v.category as vendor_category,
  c.partner1_name,
  c.partner2_name
FROM messages m
JOIN message_threads mt ON m.message_thread_id = mt.id
JOIN vendors v ON v.id = mt.vendor_id
JOIN couples c ON c.id = mt.couple_id
WHERE 
  EXISTS (
    SELECT 1 FROM vendors 
    WHERE id = mt.vendor_id 
    AND user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM couples 
    WHERE id = mt.couple_id 
    AND user_id = auth.uid()
  );

-- Create policy for messages
CREATE POLICY "Enable message access for participants"
  ON messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM message_threads mt
      WHERE mt.id = message_thread_id
      AND (
        EXISTS (
          SELECT 1 FROM vendors 
          WHERE id = mt.vendor_id 
          AND user_id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM couples 
          WHERE id = mt.couple_id 
          AND user_id = auth.uid()
        )
      )
    )
  );

-- Grant necessary permissions
GRANT SELECT ON thread_messages TO authenticated;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(message_thread_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_vendor_id ON message_threads(vendor_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_couple_id ON message_threads(couple_id);