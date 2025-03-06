-- Drop existing problematic views and policies
DROP VIEW IF EXISTS thread_details CASCADE;
DROP VIEW IF EXISTS message_thread_details CASCADE;
DROP POLICY IF EXISTS "enable_message_access" ON messages;
DROP POLICY IF EXISTS "enable_thread_access" ON message_threads;

-- Create message_threads table if it doesn't exist
CREATE TABLE IF NOT EXISTS message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  couple_id uuid REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(vendor_id, couple_id)
);

-- Update messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS message_thread_id uuid REFERENCES message_threads(id) ON DELETE CASCADE;

-- Create secure view for message threads
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

-- Create function to handle new messages and leads
CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS TRIGGER AS $$
DECLARE
  v_thread_id uuid;
  v_vendor_id uuid;
  v_couple_id uuid;
  v_is_first_message boolean;
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

  -- Check if this is the first message
  v_is_first_message := v_thread_id IS NULL;

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

  -- Create lead if this is the first message from couple to vendor
  IF v_is_first_message AND NEW.sender_id = (SELECT user_id FROM couples WHERE id = v_couple_id) THEN
    INSERT INTO leads (vendor_id, couple_id, message_id, status)
    VALUES (v_vendor_id, v_couple_id, NEW.id, 'pending');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new messages
DROP TRIGGER IF EXISTS on_message_created ON messages;
CREATE TRIGGER on_message_created
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_message();

-- Create new policies with unique names
CREATE POLICY "message_threads_access_policy"
  ON message_threads
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors 
      WHERE id = vendor_id 
      AND user_id = auth.uid()
    ) OR 
    EXISTS (
      SELECT 1 FROM couples 
      WHERE id = couple_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "messages_participant_access"
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
        ) OR
        EXISTS (
          SELECT 1 FROM couples 
          WHERE id = mt.couple_id 
          AND user_id = auth.uid()
        )
      )
    )
  );

-- Enable RLS
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(message_thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_participants ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_message_threads_participants ON message_threads(vendor_id, couple_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_last_message ON message_threads(last_message_at DESC);

-- Grant necessary permissions
GRANT ALL ON message_threads TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT SELECT ON message_thread_details TO authenticated;