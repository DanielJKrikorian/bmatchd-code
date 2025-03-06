-- Create function to send welcome notification
CREATE OR REPLACE FUNCTION send_welcome_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_name text;
  v_notification_id uuid;
BEGIN
  -- Get user's name based on role
  SELECT 
    CASE
      WHEN NEW.role = 'vendor' THEN (
        SELECT business_name 
        FROM vendors 
        WHERE user_id = NEW.id
      )
      WHEN NEW.role = 'couple' THEN (
        SELECT partner1_name || ' & ' || partner2_name 
        FROM couples 
        WHERE user_id = NEW.id
      )
      ELSE NEW.email
    END INTO v_name;

  -- Create welcome notification
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
    v_name
  ) RETURNING id INTO v_notification_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE WARNING 'Failed to create welcome notification: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for welcome notification
DROP TRIGGER IF EXISTS send_welcome_notification_trigger ON users;
CREATE TRIGGER send_welcome_notification_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_notification();

-- Add comment to document the changes
COMMENT ON FUNCTION send_welcome_notification IS 'Creates a welcome notification for new users with personalized content';