-- Drop existing trigger and function
DROP TRIGGER IF EXISTS send_notification_to_zapier_trigger ON notifications;
DROP FUNCTION IF EXISTS send_notification_to_zapier();

-- Create function to send notification to Zapier
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
        'data', jsonb_build_object(
          'email', NEW.user_email,
          'type', NEW.type,
          'title', NEW.title,
          'content', NEW.content,
          'link', NEW.link
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

-- Create trigger to send notification to Zapier
CREATE TRIGGER send_notification_to_zapier_trigger
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_notification_to_zapier();

-- Add comment to document the changes
COMMENT ON FUNCTION send_notification_to_zapier IS 'Sends notification data to Zapier webhook with improved error handling';