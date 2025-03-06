-- Drop triggers first
DROP TRIGGER IF EXISTS on_message_received ON messages CASCADE;
DROP TRIGGER IF EXISTS on_review_received ON reviews CASCADE;
DROP TRIGGER IF EXISTS on_booking_received ON appointments CASCADE;
DROP TRIGGER IF EXISTS on_appointment_update ON appointments CASCADE;

-- Then drop functions
DROP FUNCTION IF EXISTS notify_new_message() CASCADE;
DROP FUNCTION IF EXISTS notify_new_review() CASCADE;
DROP FUNCTION IF EXISTS notify_new_lead() CASCADE;
DROP FUNCTION IF EXISTS notify_appointment_update() CASCADE;
DROP FUNCTION IF EXISTS send_notification_email() CASCADE;

-- Drop existing notifications table and policies if they exist
DROP TABLE IF EXISTS notifications CASCADE;

-- Create notifications table
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

-- Create policy for notifications
CREATE POLICY "enable_user_notifications"
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

-- Create trigger for new messages
CREATE OR REPLACE FUNCTION handle_new_message()
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

CREATE TRIGGER on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_message();

-- Grant necessary permissions
GRANT ALL ON notifications TO authenticated;
GRANT EXECUTE ON FUNCTION add_notification TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);