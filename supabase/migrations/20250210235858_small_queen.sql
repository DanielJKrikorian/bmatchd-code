-- Drop existing triggers first
DROP TRIGGER IF EXISTS notify_on_new_message ON messages;
DROP TRIGGER IF EXISTS notify_on_appointment ON appointments;
DROP TRIGGER IF EXISTS notify_on_new_review ON reviews;
DROP FUNCTION IF EXISTS notify_user();

-- Create function to send email notification
CREATE OR REPLACE FUNCTION notify_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_template text;
  v_data jsonb;
BEGIN
  -- Determine notification type and recipient
  CASE TG_TABLE_NAME
    WHEN 'messages' THEN
      -- New message notification
      v_user_id := NEW.receiver_id;
      v_template := 'newMessage';
      SELECT email INTO v_email FROM users WHERE id = v_user_id;
      
      v_data := jsonb_build_object(
        'senderName', (SELECT CASE 
          WHEN EXISTS (SELECT 1 FROM vendors WHERE user_id = NEW.sender_id) 
          THEN (SELECT business_name FROM vendors WHERE user_id = NEW.sender_id)
          ELSE (
            SELECT partner1_name || ' & ' || partner2_name 
            FROM couples 
            WHERE user_id = NEW.sender_id
          )
        END),
        'message', NEW.content,
        'messageUrl', 'https://bmatchd.com/messages'
      );

    WHEN 'appointments' THEN
      -- New appointment notification
      IF TG_OP = 'INSERT' THEN
        -- Notify vendor of new appointment request
        v_user_id := (SELECT user_id FROM vendors WHERE id = NEW.vendor_id);
      ELSE
        -- Notify couple of appointment status change
        v_user_id := (SELECT user_id FROM couples WHERE id = NEW.couple_id);
      END IF;
      
      SELECT email INTO v_email FROM users WHERE id = v_user_id;
      
      v_template := CASE
        WHEN NEW.status = 'confirmed' THEN 'appointmentConfirmed'
        ELSE 'newAppointment'
      END;
      
      v_data := jsonb_build_object(
        'appointmentType', NEW.title,
        'date', NEW.wedding_date,
        'time', NEW.start_time,
        'location', NEW.description,
        'appointmentUrl', 'https://bmatchd.com/calendar'
      );

    WHEN 'reviews' THEN
      -- New review notification
      v_user_id := (SELECT user_id FROM vendors WHERE id = NEW.vendor_id);
      SELECT email INTO v_email FROM users WHERE id = v_user_id;
      
      v_template := 'newReview';
      v_data := jsonb_build_object(
        'rating', NEW.rating,
        'content', NEW.content,
        'reviewUrl', 'https://bmatchd.com/reviews'
      );
  END CASE;

  -- Call Edge Function to send email
  PERFORM
    net.http_post(
      url := CONCAT(current_setting('app.settings.supabase_url'), '/functions/v1/send-email'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', CONCAT('Bearer ', current_setting('app.settings.anon_key'))
      ),
      body := jsonb_build_object(
        'to', v_email,
        'template', v_template,
        'data', v_data
      )
    );

  RETURN NEW;
END;
$$;

-- Create triggers for notifications
CREATE TRIGGER notify_on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_user();

CREATE TRIGGER notify_on_appointment
  AFTER INSERT OR UPDATE OF status ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION notify_user();

CREATE TRIGGER notify_on_new_review
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_user();