-- Create function to send notification to Zapier
CREATE OR REPLACE FUNCTION send_notification_to_zapier()
RETURNS TRIGGER AS $$
BEGIN
  -- Send to Zapier webhook
  PERFORM net.http_post(
    'https://hooks.zapier.com/hooks/catch/13568109/2alhfqf/',
    jsonb_build_object(
      'email', NEW.user_email,
      'type', NEW.type,
      'title', NEW.title,
      'content', NEW.content,
      'link', NEW.link
    ),
    jsonb_build_object(
      'Content-Type', 'application/json'
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE WARNING 'Failed to send notification to Zapier: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to send notification to Zapier
DROP TRIGGER IF EXISTS send_notification_to_zapier_trigger ON notifications;
CREATE TRIGGER send_notification_to_zapier_trigger
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_notification_to_zapier();

-- Add comment to document the changes
COMMENT ON FUNCTION send_notification_to_zapier IS 'Sends notification data to Zapier webhook';