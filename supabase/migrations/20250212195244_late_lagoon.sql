-- Add sender and recipient name columns to notifications table
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS sender_name text,
ADD COLUMN IF NOT EXISTS recipient_name text;

-- Update existing notifications with names
UPDATE notifications n
SET 
  sender_name = CASE
    WHEN EXISTS (
      SELECT 1 FROM vendors v 
      JOIN users u ON v.user_id = u.id 
      WHERE u.id = n.user_id
    ) THEN (
      SELECT v.business_name 
      FROM vendors v 
      JOIN users u ON v.user_id = u.id 
      WHERE u.id = n.user_id
    )
    WHEN EXISTS (
      SELECT 1 FROM couples c 
      JOIN users u ON c.user_id = u.id 
      WHERE u.id = n.user_id
    ) THEN (
      SELECT c.partner1_name || ' & ' || c.partner2_name 
      FROM couples c 
      JOIN users u ON c.user_id = u.id 
      WHERE u.id = n.user_id
    )
    ELSE NULL
  END,
  recipient_name = CASE
    WHEN EXISTS (
      SELECT 1 FROM vendors v 
      JOIN users u ON v.user_id = u.id 
      WHERE u.id = n.user_id
    ) THEN (
      SELECT v.business_name 
      FROM vendors v 
      JOIN users u ON v.user_id = u.id 
      WHERE u.id = n.user_id
    )
    WHEN EXISTS (
      SELECT 1 FROM couples c 
      JOIN users u ON c.user_id = u.id 
      WHERE u.id = n.user_id
    ) THEN (
      SELECT c.partner1_name || ' & ' || c.partner2_name 
      FROM couples c 
      JOIN users u ON c.user_id = u.id 
      WHERE u.id = n.user_id
    )
    ELSE NULL
  END;

-- Create function to set notification names
CREATE OR REPLACE FUNCTION set_notification_names()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name text;
  v_recipient_name text;
BEGIN
  -- Get sender name
  SELECT 
    CASE
      WHEN EXISTS (
        SELECT 1 FROM vendors v 
        WHERE v.user_id = NEW.user_id
      ) THEN (
        SELECT v.business_name 
        FROM vendors v 
        WHERE v.user_id = NEW.user_id
      )
      WHEN EXISTS (
        SELECT 1 FROM couples c 
        WHERE c.user_id = NEW.user_id
      ) THEN (
        SELECT c.partner1_name || ' & ' || c.partner2_name 
        FROM couples c 
        WHERE c.user_id = NEW.user_id
      )
      ELSE NULL
    END INTO v_sender_name;

  -- Get recipient name
  SELECT 
    CASE
      WHEN EXISTS (
        SELECT 1 FROM vendors v 
        WHERE v.user_id = NEW.user_id
      ) THEN (
        SELECT v.business_name 
        FROM vendors v 
        WHERE v.user_id = NEW.user_id
      )
      WHEN EXISTS (
        SELECT 1 FROM couples c 
        WHERE c.user_id = NEW.user_id
      ) THEN (
        SELECT c.partner1_name || ' & ' || c.partner2_name 
        FROM couples c 
        WHERE c.user_id = NEW.user_id
      )
      ELSE NULL
    END INTO v_recipient_name;

  -- Set the names
  NEW.sender_name := v_sender_name;
  NEW.recipient_name := v_recipient_name;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to set names on insert
DROP TRIGGER IF EXISTS set_notification_names_trigger ON notifications;
CREATE TRIGGER set_notification_names_trigger
  BEFORE INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_notification_names();

-- Update Zapier notification function to include names
CREATE OR REPLACE FUNCTION send_notification_to_zapier()
RETURNS TRIGGER AS $$
DECLARE
  v_response text;
BEGIN
  -- Send to Zapier webhook
  SELECT content INTO v_response FROM 
    net.http_post(
      url := 'https://hooks.zapier.com/hooks/catch/13568109/2alhfqf/',
      body := jsonb_build_object(
        'email', NEW.user_email,
        'type', NEW.type,
        'title', NEW.title,
        'content', NEW.content,
        'link', NEW.link,
        'sender_name', NEW.sender_name,
        'recipient_name', NEW.recipient_name,
        'data', jsonb_build_object(
          'email', NEW.user_email,
          'type', NEW.type,
          'title', NEW.title,
          'content', NEW.content,
          'link', NEW.link,
          'sender_name', NEW.sender_name,
          'recipient_name', NEW.recipient_name
        )
      )::text,
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      )
    );

  -- Log response for debugging
  RAISE NOTICE 'Zapier response: %', v_response;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE WARNING 'Failed to send notification to Zapier: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments to document the changes
COMMENT ON COLUMN notifications.sender_name IS 'Name of the user/vendor who triggered the notification';
COMMENT ON COLUMN notifications.recipient_name IS 'Name of the user/vendor receiving the notification';