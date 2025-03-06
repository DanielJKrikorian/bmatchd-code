-- Drop existing view if it exists
DROP VIEW IF EXISTS vendor_messages;

-- Create a secure view for vendor messages
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
WHERE auth.uid() IN (m.sender_id, m.receiver_id);

-- Grant necessary permissions
GRANT SELECT ON vendor_messages TO authenticated;

-- Add comment to document the view
COMMENT ON VIEW vendor_messages IS 'Secure view that provides message details with vendor information';