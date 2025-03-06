-- Drop existing triggers safely
DO $$ 
BEGIN
  -- Drop message triggers if they exist
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_new_message'
    AND tgrelid = 'messages'::regclass
  ) THEN
    DROP TRIGGER on_new_message ON messages;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_message_notification'
    AND tgrelid = 'messages'::regclass
  ) THEN
    DROP TRIGGER on_message_notification ON messages;
  END IF;
END $$;

-- Drop existing functions safely
DROP FUNCTION IF EXISTS handle_new_message() CASCADE;
DROP FUNCTION IF EXISTS handle_message_notification() CASCADE;
DROP FUNCTION IF EXISTS add_notification() CASCADE;

-- Drop existing notifications table and policies if they exist
DROP TABLE IF EXISTS notifications CASCADE;

-- Create simplified notification tracking
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  content text,
  link text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for notifications with unique name
CREATE POLICY "enable_user_notification_access"
  ON notifications
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to add notification
CREATE OR REPLACE FUNCTION add_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_content text,
  p_link text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    link
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_content,
    p_link
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Create function to handle message notifications
CREATE OR REPLACE FUNCTION handle_message_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Add notification for receiver
  PERFORM add_notification(
    NEW.receiver_id,
    'message',
    'New Message',
    NEW.content,
    '/messages'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new messages with unique name
CREATE TRIGGER on_message_create_notification
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_notification();

-- Grant necessary permissions
GRANT ALL ON notifications TO authenticated;
GRANT EXECUTE ON FUNCTION add_notification TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);