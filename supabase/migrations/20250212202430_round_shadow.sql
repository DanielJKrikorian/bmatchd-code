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

-- Create function to get thread messages with proper name handling
CREATE OR REPLACE FUNCTION get_thread_messages(thread_id uuid)
RETURNS TABLE (
  id uuid,
  content text,
  created_at timestamptz,
  status text,
  message_thread_id uuid,
  sender_id uuid,
  receiver_id uuid,
  sender_name text,
  receiver_name text,
  sender_role text,
  receiver_role text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    m.id,
    m.content,
    m.created_at,
    m.status,
    m.message_thread_id,
    m.sender_id,
    m.receiver_id,
    CASE 
      WHEN v_sender.id IS NOT NULL THEN v_sender.business_name
      WHEN c_sender.id IS NOT NULL THEN c_sender.partner1_name || ' & ' || c_sender.partner2_name
      ELSE u_sender.email
    END as sender_name,
    CASE 
      WHEN v_receiver.id IS NOT NULL THEN v_receiver.business_name
      WHEN c_receiver.id IS NOT NULL THEN c_receiver.partner1_name || ' & ' || c_receiver.partner2_name
      ELSE u_receiver.email
    END as receiver_name,
    u_sender.role as sender_role,
    u_receiver.role as receiver_role
  FROM messages m
  JOIN users u_sender ON u_sender.id = m.sender_id
  JOIN users u_receiver ON u_receiver.id = m.receiver_id
  LEFT JOIN vendors v_sender ON v_sender.user_id = m.sender_id
  LEFT JOIN vendors v_receiver ON v_receiver.user_id = m.receiver_id
  LEFT JOIN couples c_sender ON c_sender.user_id = m.sender_id
  LEFT JOIN couples c_receiver ON c_receiver.user_id = m.receiver_id
  WHERE m.message_thread_id = thread_id
  AND (
    EXISTS (
      SELECT 1 FROM message_threads mt
      JOIN vendors v ON v.id = mt.vendor_id
      WHERE mt.id = thread_id
      AND v.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM message_threads mt
      JOIN couples c ON c.id = mt.couple_id
      WHERE mt.id = thread_id
      AND c.user_id = auth.uid()
    )
  )
  ORDER BY m.created_at ASC;
$$;

-- Grant necessary permissions
GRANT SELECT ON message_thread_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_thread_messages TO authenticated;

-- Add comment to document the changes
COMMENT ON VIEW message_thread_details IS 'Message thread details with proper name handling';
COMMENT ON FUNCTION get_thread_messages IS 'Retrieves messages for a thread with sender and receiver names';
COMMENT ON COLUMN message_threads.thread_status IS 'Status of the message thread (active/closed)';