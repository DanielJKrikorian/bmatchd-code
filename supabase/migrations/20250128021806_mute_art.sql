-- Drop existing views and functions first
DROP VIEW IF EXISTS message_details CASCADE;
DROP VIEW IF EXISTS message_thread_details CASCADE;
DROP FUNCTION IF EXISTS get_thread_messages(uuid);

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

-- Create view for message details with proper user role handling
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
    WHEN sender.role = 'vendor' THEN v_sender.business_name
    WHEN sender.role = 'couple' THEN (c_sender.partner1_name || ' & ' || c_sender.partner2_name)
    ELSE sender.email
  END as sender_name,
  -- Receiver details
  receiver.id as receiver_id,
  receiver.role as receiver_role,
  CASE 
    WHEN receiver.role = 'vendor' THEN v_receiver.business_name
    WHEN receiver.role = 'couple' THEN (c_receiver.partner1_name || ' & ' || c_receiver.partner2_name)
    ELSE receiver.email
  END as receiver_name,
  -- Additional details
  CASE 
    WHEN sender.role = 'vendor' THEN v_sender.id
    ELSE NULL
  END as sender_vendor_id,
  CASE 
    WHEN sender.role = 'couple' THEN c_sender.id
    ELSE NULL
  END as sender_couple_id,
  CASE 
    WHEN receiver.role = 'vendor' THEN v_receiver.id
    ELSE NULL
  END as receiver_vendor_id,
  CASE 
    WHEN receiver.role = 'couple' THEN c_receiver.id
    ELSE NULL
  END as receiver_couple_id
FROM messages m
JOIN users sender ON sender.id = m.sender_id
LEFT JOIN vendors v_sender ON v_sender.user_id = sender.id
LEFT JOIN couples c_sender ON c_sender.user_id = sender.id
JOIN users receiver ON receiver.id = m.receiver_id
LEFT JOIN vendors v_receiver ON v_receiver.user_id = receiver.id
LEFT JOIN couples c_receiver ON c_receiver.user_id = receiver.id
WHERE 
  auth.uid() IN (m.sender_id, m.receiver_id);

-- Create function to get thread messages with explicit return type
CREATE OR REPLACE FUNCTION get_thread_messages(thread_id uuid)
RETURNS TABLE (
  id uuid,
  content text,
  created_at timestamptz,
  status text,
  message_thread_id uuid,
  sender_id uuid,
  sender_role text,
  sender_name text,
  receiver_id uuid,
  receiver_role text,
  receiver_name text,
  sender_vendor_id uuid,
  sender_couple_id uuid,
  receiver_vendor_id uuid,
  receiver_couple_id uuid
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT *
  FROM message_details
  WHERE message_thread_id = thread_id
  ORDER BY created_at ASC;
$$;

-- Grant necessary permissions
GRANT SELECT ON message_thread_details TO authenticated;
GRANT SELECT ON message_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_thread_messages TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_participants_status ON messages(sender_id, receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_thread_created ON messages(message_thread_id, created_at DESC);