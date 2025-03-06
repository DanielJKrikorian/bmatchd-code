-- Create a secure view to handle message details with vendor information
CREATE OR REPLACE VIEW message_details AS
SELECT 
  m.id,
  m.sender_id,
  m.receiver_id,
  m.content,
  m.status,
  m.appointment_id,
  m.created_at,
  m.updated_at,
  CASE 
    WHEN v.id IS NOT NULL THEN jsonb_build_object(
      'id', v.id,
      'business_name', v.business_name,
      'category', v.category
    )
    ELSE NULL
  END as vendor_details,
  CASE 
    WHEN c.id IS NOT NULL THEN jsonb_build_object(
      'id', c.id,
      'partner1_name', c.partner1_name,
      'partner2_name', c.partner2_name
    )
    ELSE NULL
  END as couple_details
FROM messages m
LEFT JOIN vendors v ON v.user_id = m.sender_id OR v.user_id = m.receiver_id
LEFT JOIN couples c ON c.user_id = m.sender_id OR c.user_id = m.receiver_id;

-- Create a secure function to get message details
CREATE OR REPLACE FUNCTION get_message_details(message_id uuid)
RETURNS message_details
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT *
  FROM message_details
  WHERE id = message_id
  AND (
    auth.uid() IN (sender_id, receiver_id) OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );
$$;

-- Grant necessary permissions
GRANT SELECT ON message_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_message_details TO authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver 
ON messages(sender_id, receiver_id);