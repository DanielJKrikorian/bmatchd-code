/*
  # Update Messages Table and Add Secure View

  1. Changes
    - Safely update messages table if it exists
    - Add status field for message tracking
    - Add updated_at timestamp with trigger
    - Create secure view for vendor messages

  2. Security
    - Enable RLS
    - Add policies for message access
    - Set up secure view with proper permissions
*/

DO $$ 
BEGIN
  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'status'
  ) THEN
    ALTER TABLE messages ADD COLUMN status text CHECK (status IN ('pending', 'responded', 'booked')) DEFAULT 'pending';
  END IF;

  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE messages ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for updated_at if it doesn't exist
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create or replace secure view for vendor messages
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

-- Ensure RLS is enabled
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

-- Recreate policies
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
GRANT SELECT ON vendor_messages_secure TO authenticated;