-- Drop existing trigger and function
DROP TRIGGER IF EXISTS send_welcome_notification_trigger ON users;
DROP FUNCTION IF EXISTS send_welcome_notification();

-- Create function to send welcome notification
CREATE OR REPLACE FUNCTION send_welcome_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  -- Create welcome notification with initial values
  INSERT INTO notifications (
    user_id,
    user_email,
    type,
    title,
    content,
    link,
    sender_name,
    recipient_name
  ) VALUES (
    NEW.id,
    NEW.email,
    'welcome',
    CASE 
      WHEN NEW.role = 'vendor' THEN 'Welcome to BMATCHD!'
      WHEN NEW.role = 'couple' THEN 'Welcome to BMATCHD!'
      ELSE 'Welcome to BMATCHD!'
    END,
    CASE 
      WHEN NEW.role = 'vendor' THEN 'Thank you for joining BMATCHD! Let''s get started by setting up your vendor profile.'
      WHEN NEW.role = 'couple' THEN 'Thank you for joining BMATCHD! Let''s start planning your perfect wedding.'
      ELSE 'Thank you for joining BMATCHD!'
    END,
    CASE 
      WHEN NEW.role = 'vendor' THEN '/vendor/settings'
      WHEN NEW.role = 'couple' THEN '/couple/settings'
      ELSE '/dashboard'
    END,
    'BMATCHD Team',
    NEW.email  -- Initially set to email, will be updated by set_notification_names trigger
  ) RETURNING id INTO v_notification_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE WARNING 'Failed to create welcome notification: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for welcome notification
CREATE TRIGGER send_welcome_notification_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_notification();

-- Create function to update notification names after profile creation
CREATE OR REPLACE FUNCTION update_welcome_notification_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Update notification with proper name after profile is created
  UPDATE notifications
  SET recipient_name = CASE
    WHEN TG_TABLE_NAME = 'vendors' THEN NEW.business_name
    WHEN TG_TABLE_NAME = 'couples' THEN NEW.partner1_name || ' & ' || NEW.partner2_name
    ELSE recipient_name
  END
  WHERE user_id = NEW.user_id
  AND type = 'welcome'
  AND recipient_name = (
    SELECT email 
    FROM users 
    WHERE id = NEW.user_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to update notification names
CREATE TRIGGER update_vendor_notification_name
  AFTER INSERT ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_welcome_notification_name();

CREATE TRIGGER update_couple_notification_name
  AFTER INSERT ON couples
  FOR EACH ROW
  EXECUTE FUNCTION update_welcome_notification_name();

-- Add comments to document the changes
COMMENT ON FUNCTION send_welcome_notification IS 'Creates initial welcome notification for new users';
COMMENT ON FUNCTION update_welcome_notification_name IS 'Updates welcome notification with proper name after profile creation';