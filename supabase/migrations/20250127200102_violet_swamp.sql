-- Drop existing function and view with CASCADE
DROP FUNCTION IF EXISTS get_message_details CASCADE;
DROP VIEW IF EXISTS message_details CASCADE;

-- Create message details view without complex JSON building
CREATE VIEW message_details AS
SELECT 
  m.id,
  m.sender_id,
  m.receiver_id,
  m.content,
  m.status,
  m.appointment_id,
  m.created_at,
  m.updated_at,
  v.id as vendor_id,
  v.business_name as vendor_business_name,
  v.category as vendor_category,
  c.id as couple_id,
  c.partner1_name,
  c.partner2_name
FROM messages m
LEFT JOIN vendors v ON v.user_id = m.sender_id OR v.user_id = m.receiver_id
LEFT JOIN couples c ON c.user_id = m.sender_id OR c.user_id = m.receiver_id
WHERE auth.uid() IN (m.sender_id, m.receiver_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver 
ON messages(sender_id, receiver_id);

-- Create policy for message details
CREATE POLICY "Users can only view their own messages"
ON messages
FOR SELECT
TO authenticated
USING (auth.uid() IN (sender_id, receiver_id));

-- Recreate the get_message_details function
CREATE OR REPLACE FUNCTION get_message_details(message_id uuid)
RETURNS SETOF message_details
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT *
  FROM message_details
  WHERE id = message_id;
$$;

-- Grant necessary permissions
GRANT SELECT ON message_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_message_details TO authenticated;