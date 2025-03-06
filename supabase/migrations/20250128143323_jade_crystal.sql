-- Drop existing policies first
DROP POLICY IF EXISTS "enable_thread_access" ON message_threads;
DROP POLICY IF EXISTS "enable_message_access" ON messages;

-- Drop existing view
DROP VIEW IF EXISTS message_thread_details;

-- Create message thread details view
CREATE OR REPLACE VIEW message_thread_details AS
SELECT 
  mt.id,
  mt.vendor_id,
  mt.couple_id,
  mt.last_message_at,
  mt.created_at,
  v.business_name as vendor_name,
  v.category as vendor_category,
  c.partner1_name,
  c.partner2_name,
  (
    SELECT count(*)::int 
    FROM messages m 
    WHERE m.message_thread_id = mt.id 
    AND m.status = 'pending'
    AND m.receiver_id = auth.uid()
  ) as unread_count,
  v.user_id as vendor_user_id,
  c.user_id as couple_user_id,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM messages m 
      WHERE m.message_thread_id = mt.id 
      AND m.status = 'closed'
    ) THEN 'closed'
    ELSE 'active'
  END as status
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

-- Create new policies with unique names
CREATE POLICY "message_thread_participant_access"
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

CREATE POLICY "message_participant_access"
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