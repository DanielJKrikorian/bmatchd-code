-- Create a secure function to check message access
CREATE OR REPLACE FUNCTION check_message_access(message_row messages)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
    AND (
      auth.uid() = message_row.sender_id OR
      auth.uid() = message_row.receiver_id
    )
  );
$$;

-- Create a secure view to handle vendor messages
CREATE OR REPLACE VIEW vendor_messages AS
SELECT 
  m.id,
  m.sender_id,
  m.receiver_id,
  m.content,
  m.status,
  m.created_at,
  m.updated_at,
  v.id as vendor_id,
  v.business_name,
  v.category
FROM messages m
JOIN vendors v ON v.user_id = m.sender_id OR v.user_id = m.receiver_id
WHERE check_message_access(m.*);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_message_access TO authenticated;
GRANT SELECT ON vendor_messages TO authenticated;

-- Add comment to document the view
COMMENT ON VIEW vendor_messages IS 'Secure view that provides message details with vendor information';