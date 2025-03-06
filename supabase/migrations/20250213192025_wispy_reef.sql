-- Drop existing trigger and function
DROP TRIGGER IF EXISTS set_notification_names_trigger ON notifications;
DROP FUNCTION IF EXISTS set_notification_names();

-- Add sender_id column if it doesn't exist
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS sender_id uuid REFERENCES users(id);

-- Create improved function to set notification names
CREATE OR REPLACE FUNCTION set_notification_names()
RETURNS TRIGGER AS $$
DECLARE
  v_sender record;
  v_recipient record;
  v_sender_name text;
  v_recipient_name text;
BEGIN
  -- Get sender details if sender_id exists
  IF NEW.sender_id IS NOT NULL THEN
    SELECT u.id, u.role, v.business_name, c.partner1_name, c.partner2_name
    INTO v_sender
    FROM users u
    LEFT JOIN vendors v ON v.user_id = u.id
    LEFT JOIN couples c ON c.user_id = u.id
    WHERE u.id = NEW.sender_id;

    -- Set sender name based on role
    v_sender_name := CASE
      WHEN v_sender.role = 'vendor' AND v_sender.business_name IS NOT NULL THEN 
        v_sender.business_name
      WHEN v_sender.role = 'couple' AND v_sender.partner1_name IS NOT NULL THEN 
        v_sender.partner1_name || ' & ' || v_sender.partner2_name
      ELSE 
        'BMATCHD'
    END;
  ELSE
    v_sender_name := 'BMATCHD';
  END IF;

  -- Get recipient details
  SELECT u.id, u.role, v.business_name, c.partner1_name, c.partner2_name
  INTO v_recipient
  FROM users u
  LEFT JOIN vendors v ON v.user_id = u.id
  LEFT JOIN couples c ON c.user_id = u.id
  WHERE u.id = NEW.user_id;

  -- Set recipient name based on role
  v_recipient_name := CASE
    WHEN v_recipient.role = 'vendor' AND v_recipient.business_name IS NOT NULL THEN 
      v_recipient.business_name
    WHEN v_recipient.role = 'couple' AND v_recipient.partner1_name IS NOT NULL THEN 
      v_recipient.partner1_name || ' & ' || v_recipient.partner2_name
    ELSE 
      'User'
  END;

  -- Set the names
  NEW.sender_name := v_sender_name;
  NEW.recipient_name := v_recipient_name;
  
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
          WHEN u.role = 'vendor' THEN v.business_name
          WHEN u.role = 'couple' THEN c.partner1_name || ' & ' || c.partner2_name
          ELSE 'BMATCHD'
        END
      FROM users u
      LEFT JOIN vendors v ON v.user_id = u.id
      LEFT JOIN couples c ON c.user_id = u.id
      WHERE u.id = n.sender_id
    ),
    'BMATCHD'
  ),
  recipient_name = (
    SELECT 
      CASE
        WHEN u.role = 'vendor' THEN v.business_name
        WHEN u.role = 'couple' THEN c.partner1_name || ' & ' || c.partner2_name
        ELSE 'User'
      END
    FROM users u
    LEFT JOIN vendors v ON v.user_id = u.id
    LEFT JOIN couples c ON c.user_id = u.id
    WHERE u.id = n.user_id
  );

-- Add comments to document the changes
COMMENT ON COLUMN notifications.sender_id IS 'ID of the user who triggered the notification (optional)';
COMMENT ON COLUMN notifications.sender_name IS 'Display name of the notification sender';
COMMENT ON COLUMN notifications.recipient_name IS 'Display name of the notification recipient';
COMMENT ON FUNCTION set_notification_names IS 'Sets sender and recipient names for notifications based on user roles';