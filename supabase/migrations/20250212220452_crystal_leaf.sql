-- Drop existing view if it exists
DROP VIEW IF EXISTS message_thread_details;

-- Add message thread status column
ALTER TABLE message_threads
ADD COLUMN IF NOT EXISTS thread_status text NOT NULL DEFAULT 'active' CHECK (thread_status IN ('active', 'closed'));

-- Create view for message thread details with proper name handling
CREATE VIEW message_thread_details AS
SELECT 
  mt.id,
  mt.vendor_id,
  mt.couple_id,
  mt.last_message_at,
  mt.created_at,
  mt.thread_status,
  v.business_name as vendor_name,
  v.category as vendor_category,
  c.partner1_name,
  c.partner2_name,
  v.user_id as vendor_user_id,
  c.user_id as couple_user_id,
  (
    SELECT count(*)::int 
    FROM messages m 
    WHERE m.message_thread_id = mt.id 
    AND m.status = 'pending'
    AND m.receiver_id = auth.uid()
  ) as unread_count
FROM message_threads mt
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

-- Create policy for message threads
CREATE POLICY "enable_thread_access"
  ON message_threads
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors 
      WHERE id = vendor_id 
      AND user_id = auth.uid()
    ) OR 
    EXISTS (
      SELECT 1 FROM couples 
      WHERE id = couple_id 
      AND user_id = auth.uid()
    )
  );

-- Create policy for messages
CREATE POLICY "enable_message_access"
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
        ) OR
        EXISTS (
          SELECT 1 FROM couples 
          WHERE id = mt.couple_id 
          AND user_id = auth.uid()
        )
      )
    )
  );

-- Grant necessary permissions
GRANT SELECT ON message_thread_details TO authenticated;