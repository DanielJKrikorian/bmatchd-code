-- Drop existing function and view with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS get_message_details CASCADE;
DROP VIEW IF EXISTS message_details CASCADE;
DROP VIEW IF EXISTS vendor_messages CASCADE;

-- Add message_thread_id to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS message_thread_id uuid;

-- Create message threads table
CREATE TABLE IF NOT EXISTS message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  couple_id uuid REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(vendor_id, couple_id)
);

-- Enable RLS
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;

-- Create policies for message threads
CREATE POLICY "Enable read for participants"
  ON message_threads
  FOR SELECT
  TO authenticated
  USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()) OR
    couple_id IN (SELECT id FROM couples WHERE user_id = auth.uid())
  );

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
  v.user_id = auth.uid() OR
  c.user_id = auth.uid();

-- Grant permissions
GRANT SELECT ON message_thread_details TO authenticated;

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

-- Update existing messages with thread IDs
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT DISTINCT
      m.id as message_id,
      v.id as vendor_id,
      c.id as couple_id
    FROM messages m
    JOIN vendors v ON v.user_id IN (m.sender_id, m.receiver_id)
    JOIN couples c ON c.user_id IN (m.sender_id, m.receiver_id)
    WHERE m.message_thread_id IS NULL
  LOOP
    -- Get or create thread
    WITH thread AS (
      INSERT INTO message_threads (vendor_id, couple_id)
      VALUES (r.vendor_id, r.couple_id)
      ON CONFLICT (vendor_id, couple_id) DO UPDATE
      SET last_message_at = now()
      RETURNING id
    )
    UPDATE messages
    SET message_thread_id = (SELECT id FROM thread)
    WHERE id = r.message_id;
  END LOOP;
END $$;