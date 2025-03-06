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
LEFT JOIN couples c ON c.user_id = m.sender_id OR c.user_id = m.receiver_id
WHERE EXISTS (
  SELECT 1 FROM auth.users
  WHERE id = auth.uid()
  AND (
    auth.uid() = m.sender_id OR
    auth.uid() = m.receiver_id
  )
);

-- Grant necessary permissions
GRANT SELECT ON message_details TO authenticated;

-- Create index on messages for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);

-- Add comment to document the view
COMMENT ON VIEW message_details IS 'Secure view that provides message details with related vendor and couple information';