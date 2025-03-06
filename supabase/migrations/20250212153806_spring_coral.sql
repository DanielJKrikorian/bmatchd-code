-- Drop existing notification email function if it exists
DROP FUNCTION IF EXISTS send_notification_email() CASCADE;
DROP FUNCTION IF EXISTS send_notification_email_v1() CASCADE;

-- Create function to send notification email through Edge Function with unique name
CREATE OR REPLACE FUNCTION send_notification_email_v2()
RETURNS TRIGGER AS $$
DECLARE
  v_email text;
  v_user_preferences record;
BEGIN
  -- Get user's email
  SELECT email INTO v_email
  FROM users
  WHERE id = NEW.user_id;

  -- Get notification preferences
  SELECT * INTO v_user_preferences
  FROM notification_preferences
  WHERE user_id = NEW.user_id;

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
    -- Send to Edge Function
    PERFORM
      net.http_post(
        url := CONCAT(current_setting('app.settings.supabase_url'), '/functions/v1/send-email'),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', CONCAT('Bearer ', current_setting('app.settings.anon_key'))
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
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE WARNING 'Failed to send notification email: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new notifications
DROP TRIGGER IF EXISTS on_notification_created ON notifications;
CREATE TRIGGER on_notification_created
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_notification_email_v2();

-- Add comment to document the changes
COMMENT ON FUNCTION send_notification_email_v2 IS 'Sends email notifications through Edge Function when new notifications are created';