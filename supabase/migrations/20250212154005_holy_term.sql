-- Drop existing notification email functions if they exist
DROP FUNCTION IF EXISTS send_notification_email() CASCADE;
DROP FUNCTION IF EXISTS send_notification_email_v1() CASCADE;
DROP FUNCTION IF EXISTS send_notification_email_v2() CASCADE;

-- Create function to send notification email through Zapier with unique name
CREATE OR REPLACE FUNCTION send_notification_email_v3()
RETURNS TRIGGER AS $$
DECLARE
  v_email text;
  v_user_preferences record;
BEGIN
  -- Get user's email and ensure it exists
  SELECT email INTO STRICT v_email
  FROM users
  WHERE id = NEW.user_id;

  -- Get notification preferences with default values if not found
  SELECT 
    COALESCE(np.new_message, true) as new_message,
    COALESCE(np.new_review, true) as new_review,
    COALESCE(np.new_booking, true) as new_booking,
    COALESCE(np.new_lead, true) as new_lead,
    COALESCE(np.appointment_updates, true) as appointment_updates
  INTO v_user_preferences
  FROM (SELECT NEW.user_id) u
  LEFT JOIN notification_preferences np ON np.user_id = u.user_id;

  -- Only send if user has enabled this type of notification
  IF (
    CASE
      WHEN NEW.type = 'message' AND v_user_preferences.new_message THEN true
      WHEN NEW.type = 'review' AND v_user_preferences.new_review THEN true
      WHEN NEW.type = 'booking' AND v_user_preferences.new_booking THEN true
      WHEN NEW.type = 'lead' AND v_user_preferences.new_lead THEN true
      WHEN NEW.type = 'appointment' AND v_user_preferences.appointment_updates THEN true
      ELSE false
    END
  ) THEN
    -- Send to Zapier webhook
    PERFORM net.http_post(
      url := 'https://hooks.zapier.com/hooks/catch/13568109/2alhfqf/',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'to', v_email,
        'template', NEW.type,
        'data', jsonb_build_object(
          'title', NEW.title,
          'content', NEW.content,
          'link', NEW.link
        )
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION 
  WHEN NO_DATA_FOUND THEN
    -- Log warning if user not found but don't fail
    RAISE WARNING 'User not found for notification: %', NEW.user_id;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log other errors but don't fail the transaction
    RAISE WARNING 'Failed to send notification email: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new notifications
DROP TRIGGER IF EXISTS on_notification_created ON notifications;
CREATE TRIGGER on_notification_created
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_notification_email_v3();

-- Add comment to document the changes
COMMENT ON FUNCTION send_notification_email_v3 IS 'Sends email notifications through Zapier when new notifications are created';