-- Drop existing view if it exists
DROP VIEW IF EXISTS message_thread_details;

-- Create improved view for message thread details
CREATE OR REPLACE VIEW message_thread_details AS
WITH thread_participants AS (
  SELECT 
    mt.id as thread_id,
    mt.vendor_id,
    mt.couple_id,
    mt.last_message_at,
    mt.created_at,
    mt.thread_status,
    v.business_name as vendor_name,
    v.category as vendor_category,
    v.user_id as vendor_user_id,
    c.partner1_name,
    c.partner2_name,
    c.user_id as couple_user_id
  FROM message_threads mt
  LEFT JOIN vendors v ON v.id = mt.vendor_id
  LEFT JOIN couples c ON c.id = mt.couple_id
)
SELECT 
  thread_id as id,
  vendor_id,
  couple_id,
  last_message_at,
  created_at,
  thread_status,
  vendor_name,
  vendor_category,
  partner1_name,
  partner2_name,
  vendor_user_id,
  couple_user_id,
  (
    SELECT count(*)::int 
    FROM messages m 
    WHERE m.message_thread_id = thread_id
    AND m.status = 'pending'
    AND m.receiver_id = auth.uid()
  ) as unread_count
FROM thread_participants tp
WHERE 
  EXISTS (
    SELECT 1 FROM vendors 
    WHERE id = tp.vendor_id 
    AND user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM couples 
    WHERE id = tp.couple_id 
    AND user_id = auth.uid()
  );

-- Grant necessary permissions
GRANT SELECT ON message_thread_details TO authenticated;

-- Add comment to document the changes
COMMENT ON VIEW message_thread_details IS 'Message thread details with proper name handling and participant information';