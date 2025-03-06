-- Drop existing view if it exists
DROP VIEW IF EXISTS message_thread_details;

-- Ensure messages table has correct schema
DROP TABLE IF EXISTS messages CASCADE;
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'read', 'accepted', 'declined', 'closed')),
  message_thread_id uuid REFERENCES message_threads(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create view for message thread details
CREATE OR REPLACE VIEW message_thread_details AS
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

-- Create function to get thread messages
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
  WITH sender_info AS (
    SELECT 
      u.id,
      u.role,
      CASE 
        WHEN v.id IS NOT NULL THEN v.business_name
        WHEN c.id IS NOT NULL THEN c.partner1_name || ' & ' || c.partner2_name
        ELSE u.email
      END as display_name
    FROM users u
    LEFT JOIN vendors v ON v.user_id = u.id
    LEFT JOIN couples c ON c.user_id = u.id
  )
  SELECT 
    m.id,
    m.content,
    m.created_at,
    m.status,
    m.message_thread_id,
    m.sender_id,
    m.receiver_id,
    s.display_name as sender_name,
    r.display_name as receiver_name,
    s.role as sender_role,
    r.role as receiver_role
  FROM messages m
  JOIN sender_info s ON s.id = m.sender_id
  JOIN sender_info r ON r.id = m.receiver_id
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(message_thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_participants ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

-- Grant necessary permissions
GRANT SELECT ON message_thread_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_thread_messages TO authenticated;

-- Add comments to document the changes
COMMENT ON TABLE messages IS 'Stores messages between vendors and couples';
COMMENT ON VIEW message_thread_details IS 'Message thread details with proper name handling';
COMMENT ON FUNCTION get_thread_messages IS 'Retrieves messages for a thread with proper sender and receiver names';