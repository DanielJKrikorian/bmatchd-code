-- Drop existing triggers first
DROP TRIGGER IF EXISTS notify_on_new_message ON messages;
DROP TRIGGER IF EXISTS notify_on_appointment ON appointments;
DROP TRIGGER IF EXISTS notify_on_new_review ON reviews;
DROP FUNCTION IF EXISTS notify_user();

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
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
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
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
  v_email text;
BEGIN
  -- Insert notification
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

  -- Get user's email
  SELECT email INTO v_email
  FROM users
  WHERE id = p_user_id;

  -- Call Edge Function to send email
  PERFORM
    http_post(
      'https://rtzrhxxdqmnpydskixso.supabase.co/functions/v1/send-email',
      jsonb_build_object(
        'to', v_email,
        'template', p_type,
        'data', jsonb_build_object(
          'title', p_title,
          'content', p_content,
          'link', p_link
        )
      ),
      jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.anon_key')
      )
    );
  
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

-- Create function to handle appointment notifications
CREATE OR REPLACE FUNCTION handle_appointment_notification() 
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Notify vendor of new appointment
    PERFORM add_notification(
      (SELECT user_id FROM vendors WHERE id = NEW.vendor_id),
      'appointment',
      'New Appointment Request',
      NEW.title,
      '/calendar'
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Notify couple of status change
    PERFORM add_notification(
      (SELECT user_id FROM couples WHERE id = NEW.couple_id),
      'appointment',
      'Appointment Status Updated',
      format('Your appointment "%s" has been %s', NEW.title, NEW.status),
      '/appointments'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle review notifications
CREATE OR REPLACE FUNCTION handle_review_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify vendor of new review
  PERFORM add_notification(
    (SELECT user_id FROM vendors WHERE id = NEW.vendor_id),
    'review',
    'New Review Received',
    format('You received a %s-star review', NEW.rating),
    '/reviews'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for notifications
CREATE TRIGGER on_message_notification
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_notification();

CREATE TRIGGER on_appointment_notification
  AFTER INSERT OR UPDATE OF status ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION handle_appointment_notification();

CREATE TRIGGER on_review_notification
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION handle_review_notification();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Add http extension if not exists
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Grant necessary permissions
GRANT ALL ON notifications TO authenticated;