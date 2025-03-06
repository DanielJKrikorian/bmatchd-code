-- Create notification preferences table
CREATE TABLE notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  new_message boolean DEFAULT true,
  new_review boolean DEFAULT true,
  new_booking boolean DEFAULT true,
  new_lead boolean DEFAULT true,
  appointment_updates boolean DEFAULT true,
  marketing_emails boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policy for notification preferences
CREATE POLICY "Users can manage their own preferences"
  ON notification_preferences
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create function to initialize notification preferences
CREATE OR REPLACE FUNCTION initialize_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to initialize preferences for new users
CREATE TRIGGER on_user_created
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_notification_preferences();

-- Create function to send email notifications
CREATE OR REPLACE FUNCTION send_notification_email(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_content text,
  p_link text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email text;
  v_preferences record;
BEGIN
  -- Get user's email and preferences
  SELECT email INTO v_email
  FROM users
  WHERE id = p_user_id;

  SELECT * INTO v_preferences
  FROM notification_preferences
  WHERE user_id = p_user_id;

  -- Check if user wants this type of notification
  IF (
    CASE
      WHEN p_type = 'message' AND v_preferences.new_message THEN true
      WHEN p_type = 'review' AND v_preferences.new_review THEN true
      WHEN p_type = 'booking' AND v_preferences.new_booking THEN true
      WHEN p_type = 'lead' AND v_preferences.new_lead THEN true
      WHEN p_type = 'appointment' AND v_preferences.appointment_updates THEN true
      ELSE false
    END
  ) THEN
    -- Send email using Edge Function
    PERFORM
      net.http_post(
        url := CONCAT(current_setting('app.settings.supabase_url'), '/functions/v1/send-email'),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', CONCAT('Bearer ', current_setting('app.settings.anon_key'))
        ),
        body := jsonb_build_object(
          'to', v_email,
          'template', p_type,
          'data', jsonb_build_object(
            'title', p_title,
            'content', p_content,
            'link', p_link
          )
        )
      );
  END IF;
END;
$$;

-- Create triggers for various events

-- New message notification
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify receiver
  PERFORM send_notification_email(
    NEW.receiver_id,
    'message',
    'New Message Received',
    NEW.content,
    '/messages'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- New review notification
CREATE OR REPLACE FUNCTION notify_new_review()
RETURNS TRIGGER AS $$
DECLARE
  v_vendor_user_id uuid;
BEGIN
  -- Get vendor's user ID
  SELECT user_id INTO v_vendor_user_id
  FROM vendors
  WHERE id = NEW.vendor_id;

  -- Notify vendor
  PERFORM send_notification_email(
    v_vendor_user_id,
    'review',
    'New Review Received',
    format('You received a %s-star review', NEW.rating),
    '/reviews'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_review
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_review();

-- New lead notification
CREATE OR REPLACE FUNCTION notify_new_lead()
RETURNS TRIGGER AS $$
DECLARE
  v_vendor_user_id uuid;
BEGIN
  -- Get vendor's user ID
  SELECT user_id INTO v_vendor_user_id
  FROM vendors
  WHERE id = NEW.vendor_id;

  -- Notify vendor
  PERFORM send_notification_email(
    v_vendor_user_id,
    'lead',
    'New Lead Received',
    'A new couple is interested in your services',
    '/vendor/leads'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_lead
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_lead();

-- Appointment status change notification
CREATE OR REPLACE FUNCTION notify_appointment_update()
RETURNS TRIGGER AS $$
DECLARE
  v_vendor_user_id uuid;
  v_couple_user_id uuid;
BEGIN
  -- Get user IDs
  SELECT user_id INTO v_vendor_user_id
  FROM vendors
  WHERE id = NEW.vendor_id;

  SELECT user_id INTO v_couple_user_id
  FROM couples
  WHERE id = NEW.couple_id;

  -- Notify based on status change
  IF NEW.status != OLD.status THEN
    -- Notify couple
    PERFORM send_notification_email(
      v_couple_user_id,
      'appointment',
      format('Appointment %s', NEW.status),
      format('Your appointment "%s" has been %s', NEW.title, NEW.status),
      '/appointments'
    );

    -- Notify vendor
    PERFORM send_notification_email(
      v_vendor_user_id,
      'appointment',
      format('Appointment %s', NEW.status),
      format('Appointment "%s" has been %s', NEW.title, NEW.status),
      '/calendar'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_appointment_update
  AFTER UPDATE OF status ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION notify_appointment_update();

-- Grant necessary permissions
GRANT ALL ON notification_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION send_notification_email TO authenticated;

-- Create indexes for better performance
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);