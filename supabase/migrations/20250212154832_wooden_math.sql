-- Add email column to notifications table
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS user_email text;

-- Update existing notifications with user emails
UPDATE notifications n
SET user_email = u.email
FROM users u
WHERE n.user_id = u.id;

-- Create function to automatically set email on new notifications
CREATE OR REPLACE FUNCTION set_notification_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Get user's email
  SELECT email INTO NEW.user_email
  FROM users
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to set email on insert
DROP TRIGGER IF EXISTS set_notification_email_trigger ON notifications;
CREATE TRIGGER set_notification_email_trigger
  BEFORE INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_notification_email();

-- Add comment to document the changes
COMMENT ON COLUMN notifications.user_email IS 'Email address of the notification recipient';