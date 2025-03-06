-- Drop existing problematic objects safely
DROP VIEW IF EXISTS vendor_messages CASCADE;
DROP VIEW IF EXISTS message_details CASCADE;
DROP VIEW IF EXISTS thread_messages CASCADE;
DROP VIEW IF EXISTS message_thread_details CASCADE;
DROP VIEW IF EXISTS thread_details CASCADE;
DROP FUNCTION IF EXISTS check_message_access CASCADE;
DROP FUNCTION IF EXISTS notify_user CASCADE;
DROP FUNCTION IF EXISTS get_thread_messages CASCADE;

-- Drop existing policies safely
DROP POLICY IF EXISTS "message_access_policy" ON messages;
DROP POLICY IF EXISTS "enable_message_access" ON messages;
DROP POLICY IF EXISTS "Enable message access for participants" ON messages;
DROP POLICY IF EXISTS "basic_message_access" ON messages;

-- Create secure view for message threads
CREATE VIEW message_thread_details AS
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
CREATE POLICY "enable_messages_access"
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

  IF v_vendor_id IS NULL OR v_couple_id IS NULL THEN
    RAISE EXCEPTION 'Invalid message participants';
  END IF;

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

-- Grant necessary permissions
GRANT SELECT ON message_thread_details TO authenticated;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(message_thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_participants ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_message_threads_participants ON message_threads(vendor_id, couple_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_last_message ON message_threads(last_message_at DESC);