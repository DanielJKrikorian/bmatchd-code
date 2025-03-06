-- Add appointment_id to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_appointment_id ON messages(appointment_id);

-- Drop existing view if it exists
DROP VIEW IF EXISTS message_details CASCADE;

-- Create view for message details with proper user role handling
CREATE VIEW message_details AS
SELECT 
  m.id,
  m.content,
  m.created_at,
  m.status,
  m.message_thread_id,
  m.appointment_id,
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
  END as receiver_couple_id,
  -- Appointment details
  a.id as appt_id,
  a.title as appt_title,
  a.description as appt_description,
  a.wedding_date as appt_wedding_date,
  a.start_time as appt_start_time,
  a.status as appt_status
FROM messages m
JOIN users sender ON sender.id = m.sender_id
LEFT JOIN vendors v_sender ON v_sender.user_id = sender.id
LEFT JOIN couples c_sender ON c_sender.user_id = sender.id
JOIN users receiver ON receiver.id = m.receiver_id
LEFT JOIN vendors v_receiver ON v_receiver.user_id = receiver.id
LEFT JOIN couples c_receiver ON c_receiver.user_id = receiver.id
LEFT JOIN appointments a ON a.id = m.appointment_id
WHERE 
  auth.uid() IN (m.sender_id, m.receiver_id);

-- Grant necessary permissions
GRANT SELECT ON message_details TO authenticated;