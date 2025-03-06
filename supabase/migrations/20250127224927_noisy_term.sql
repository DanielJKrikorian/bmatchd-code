-- Drop existing problematic views and functions
DROP VIEW IF EXISTS vendor_messages CASCADE;
DROP VIEW IF EXISTS message_details CASCADE;
DROP VIEW IF EXISTS thread_messages CASCADE;
DROP FUNCTION IF EXISTS check_message_access CASCADE;
DROP FUNCTION IF EXISTS notify_user CASCADE;

-- Drop existing policies safely
DROP POLICY IF EXISTS "message_access_policy" ON messages;
DROP POLICY IF EXISTS "Enable message access for participants" ON messages;

-- Create message thread details view
CREATE OR REPLACE VIEW message_thread_details AS
SELECT 
  mt.id,
  mt.vendor_id,
  mt.couple_id,
  mt.last_message_at,
  mt.created_at,
  v.business_name as vendor_name,
  v.category as vendor_category,
  c.partner1_name,
  c.partner2_name,
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

-- Create basic policy for messages
CREATE POLICY "enable_message_access"
  ON messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM message_threads mt
      WHERE mt.id = message_thread_id
      AND (
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
        )
      )
    )
  );

-- Create function to handle new messages
CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS TRIGGER AS $$
DECLARE
  v_thread_id uuid;
  v_vendor_id uuid;
  v_couple_id uuid;
BEGIN
  -- Get vendor and couple IDs
  SELECT id INTO v_vendor_id
  FROM vendors
  WHERE user_id IN (NEW.sender_id, NEW.receiver_id)
  LIMIT 1;

  SELECT id INTO v_couple_id
  FROM couples
  WHERE user_id IN (NEW.sender_id, NEW.receiver_id)
  LIMIT 1;

  -- Get or create message thread
  SELECT id INTO v_thread_id
  FROM message_threads
  WHERE vendor_id = v_vendor_id AND couple_id = v_couple_id;

  IF v_thread_id IS NULL THEN
    INSERT INTO message_threads (vendor_id, couple_id)
    VALUES (v_vendor_id, v_couple_id)
    RETURNING id INTO v_thread_id;
  ELSE
    UPDATE message_threads
    SET last_message_at = now()
    WHERE id = v_thread_id;
  END IF;

  -- Set thread ID on message
  NEW.message_thread_id := v_thread_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new messages
DROP TRIGGER IF EXISTS on_message_created ON messages;
CREATE TRIGGER on_message_created
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_message();

-- Create function to get thread messages
CREATE OR REPLACE FUNCTION get_thread_messages(thread_id uuid)
RETURNS TABLE (
  id uuid,
  sender_id uuid,
  receiver_id uuid,
  content text,
  status text,
  created_at timestamptz,
  message_thread_id uuid,
  appointment_id uuid
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT m.id, m.sender_id, m.receiver_id, m.content, m.status, m.created_at, m.message_thread_id, m.appointment_id
  FROM messages m
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(message_thread_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_vendor_id ON message_threads(vendor_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_couple_id ON message_threads(couple_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);