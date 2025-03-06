-- Drop existing trigger and function
DROP TRIGGER IF EXISTS set_notification_names_trigger ON notifications;
DROP FUNCTION IF EXISTS set_notification_names();

-- Add sender_id column if it doesn't exist
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS sender_id uuid REFERENCES users(id),
ADD COLUMN IF NOT EXISTS sender_name text,
ADD COLUMN IF NOT EXISTS recipient_name text;

-- Create improved function to set notification names
CREATE OR REPLACE FUNCTION set_notification_names()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name text;
  v_recipient_name text;
BEGIN
  -- Get sender name if sender_id exists
  IF NEW.sender_id IS NOT NULL THEN
    SELECT 
      CASE
        WHEN v.id IS NOT NULL THEN v.business_name
        WHEN c.id IS NOT NULL THEN c.partner1_name || ' & ' || c.partner2_name
        ELSE 'BMATCHD'
      END INTO v_sender_name
    FROM users u
    LEFT JOIN vendors v ON v.user_id = u.id
    LEFT JOIN couples c ON c.user_id = u.id
    WHERE u.id = NEW.sender_id;
  ELSE
    v_sender_name := 'BMATCHD';
  END IF;

  -- Get recipient name
  SELECT 
    CASE
      WHEN v.id IS NOT NULL THEN v.business_name
      WHEN c.id IS NOT NULL THEN c.partner1_name || ' & ' || c.partner2_name
      ELSE 'User'
    END INTO v_recipient_name
  FROM users u
  LEFT JOIN vendors v ON v.user_id = u.id
  LEFT JOIN couples c ON c.user_id = u.id
  WHERE u.id = NEW.user_id;

  -- Set the names
  NEW.sender_name := COALESCE(v_sender_name, 'BMATCHD');
  NEW.recipient_name := COALESCE(v_recipient_name, 'User');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to set names on insert
CREATE TRIGGER set_notification_names_trigger
  BEFORE INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_notification_names();

-- Update existing notifications with correct names
UPDATE notifications n
SET 
  sender_name = COALESCE(
    (
      SELECT 
        CASE
          WHEN v.id IS NOT NULL THEN v.business_name
          WHEN c.id IS NOT NULL THEN c.partner1_name || ' & ' || c.partner2_name
          ELSE 'BMATCHD'
        END
      FROM users u
      LEFT JOIN vendors v ON v.user_id = u.id
      LEFT JOIN couples c ON c.user_id = u.id
      WHERE u.id = n.sender_id
    ),
    'BMATCHD'
  ),
  recipient_name = COALESCE(
    (
      SELECT 
        CASE
          WHEN v.id IS NOT NULL THEN v.business_name
          WHEN c.id IS NOT NULL THEN c.partner1_name || ' & ' || c.partner2_name
          ELSE 'User'
        END
      FROM users u
      LEFT JOIN vendors v ON v.user_id = u.id
      LEFT JOIN couples c ON c.user_id = u.id
      WHERE u.id = n.user_id
    ),
    'User'
  );

-- Add comments to document the changes
COMMENT ON COLUMN notifications.sender_id IS 'ID of the user who triggered the notification (optional)';
COMMENT ON COLUMN notifications.sender_name IS 'Display name of the notification sender';
COMMENT ON COLUMN notifications.recipient_name IS 'Display name of the notification recipient';
COMMENT ON FUNCTION set_notification_names IS 'Sets sender and recipient names for notifications based on user roles';