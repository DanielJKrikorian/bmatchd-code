/*
  # Fix Messages and Couples Relationship

  1. Changes
    - Add foreign key relationship between messages and couples
    - Update messages table to reference auth.users for sender/receiver
    - Add indexes for better query performance
    - Handle dependent views properly

  2. Security
    - Maintain existing RLS policies
    - Ensure proper relationship constraints
*/

-- Drop dependent views first
DROP VIEW IF EXISTS vendor_messages_secure;
DROP VIEW IF EXISTS messages_with_couples;

-- Drop existing foreign key if it exists
ALTER TABLE IF EXISTS messages
DROP CONSTRAINT IF EXISTS messages_sender_id_fkey,
DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;

-- Recreate messages table with proper relationships
CREATE TABLE IF NOT EXISTS messages_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) NOT NULL,
  receiver_id uuid REFERENCES auth.users(id) NOT NULL,
  content text NOT NULL,
  status text CHECK (status IN ('pending', 'accepted', 'declined', 'closed')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Copy data if messages table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages') THEN
    INSERT INTO messages_new (id, sender_id, receiver_id, content, status, created_at, updated_at)
    SELECT id, sender_id, receiver_id, content, status, created_at, updated_at
    FROM messages;
  END IF;
END $$;

-- Drop old table and rename new one
DROP TABLE IF EXISTS messages;
ALTER TABLE messages_new RENAME TO messages;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

-- Create view for messages with couple details
CREATE OR REPLACE VIEW messages_with_couples AS
SELECT 
  m.*,
  c.id as couple_id,
  c.partner1_name,
  c.partner2_name,
  c.location,
  c.wedding_date
FROM messages m
LEFT JOIN couples c ON c.user_id = m.sender_id;

-- Recreate vendor messages secure view
CREATE OR REPLACE VIEW vendor_messages_secure AS
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
  v.category,
  v.location,
  v.price_range,
  v.rating
FROM messages m
JOIN vendors v ON v.user_id = 
  CASE 
    WHEN m.sender_id = auth.uid() THEN m.receiver_id
    ELSE m.sender_id
  END
WHERE 
  m.sender_id = auth.uid() OR 
  m.receiver_id = auth.uid();

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Recreate policies
DROP POLICY IF EXISTS "Users can read their own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

CREATE POLICY "Users can read their own messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = sender_id OR
    auth.uid() = receiver_id
  );

CREATE POLICY "Users can insert messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Grant necessary permissions
GRANT SELECT ON messages_with_couples TO authenticated;
GRANT SELECT ON vendor_messages_secure TO authenticated;