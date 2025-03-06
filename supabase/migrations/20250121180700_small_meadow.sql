/*
  # Messages and Vendor Messages System

  1. Changes
    - Drop and recreate messages table with proper relationships
    - Add status field for tracking message/inquiry status
    - Create function and trigger for updated_at timestamp
    - Create secure view for vendor messages

  2. Security
    - Enable RLS on messages table
    - Add policies for message access control
*/

BEGIN;

-- Drop existing messages table if it exists
DROP TABLE IF EXISTS messages CASCADE;

-- Create messages table with proper relationships
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) NOT NULL,
  receiver_id uuid REFERENCES auth.users(id) NOT NULL,
  content text NOT NULL,
  status text CHECK (status IN ('pending', 'responded', 'booked')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create function to update updated_at timestamp
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

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create secure view for vendor messages
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

-- Grant necessary permissions
GRANT SELECT ON vendor_messages_secure TO authenticated;

COMMIT;