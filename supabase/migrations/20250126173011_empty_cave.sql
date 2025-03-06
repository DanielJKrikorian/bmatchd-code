-- Add appointment_id column to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_appointment_id ON messages(appointment_id);

-- Create function to get appointment details
CREATE OR REPLACE FUNCTION get_message_appointment(message_row messages)
RETURNS TABLE (
  appointment_title text,
  appointment_description text,
  appointment_wedding_date timestamptz,
  appointment_start_time timestamptz,
  appointment_status text
) 
LANGUAGE sql
STABLE
AS $$
  SELECT 
    a.title,
    a.description,
    a.wedding_date,
    a.start_time,
    a.status
  FROM appointments a
  WHERE a.id = message_row.appointment_id;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_message_appointment TO authenticated;

-- Create policy for messages to include appointment access
CREATE POLICY "enable_appointment_access"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT appointment_id 
      FROM messages 
      WHERE sender_id = auth.uid() 
      OR receiver_id = auth.uid()
    )
  );