-- Drop existing problematic views
DROP VIEW IF EXISTS thread_details CASCADE;
DROP VIEW IF EXISTS message_thread_details CASCADE;

-- Create secure view for message threads
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
  c.user_id as couple_user_id
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

-- Create view for message details
CREATE OR REPLACE VIEW message_details AS
SELECT 
  m.id,
  m.content,
  m.created_at,
  m.status,
  m.message_thread_id,
  -- Sender details
  sender.id as sender_id,
  sender.role as sender_role,
  CASE 
    WHEN sender.role = 'vendor' THEN (
      SELECT business_name 
      FROM vendors 
      WHERE user_id = sender.id
    )
    WHEN sender.role = 'couple' THEN (
      SELECT partner1_name || ' & ' || partner2_name 
      FROM couples 
      WHERE user_id = sender.id
    )
  END as sender_name,
  -- Receiver details
  receiver.id as receiver_id,
  receiver.role as receiver_role,
  CASE 
    WHEN receiver.role = 'vendor' THEN (
      SELECT business_name 
      FROM vendors 
      WHERE user_id = receiver.id
    )
    WHEN receiver.role = 'couple' THEN (
      SELECT partner1_name || ' & ' || partner2_name 
      FROM couples 
      WHERE user_id = receiver.id
    )
  END as receiver_name
FROM messages m
JOIN users sender ON sender.id = m.sender_id
JOIN users receiver ON receiver.id = m.receiver_id
WHERE 
  auth.uid() IN (m.sender_id, m.receiver_id);

-- Grant necessary permissions
GRANT SELECT ON message_thread_details TO authenticated;
GRANT SELECT ON message_details TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_participants_status ON messages(sender_id, receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_thread_created ON messages(message_thread_id, created_at DESC);