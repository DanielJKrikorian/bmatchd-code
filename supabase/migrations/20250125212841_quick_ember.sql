-- Create activities table
CREATE TABLE vendor_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('message', 'review', 'booking', 'subscription', 'profile_update')),
  title text NOT NULL,
  content text,
  actor_id uuid REFERENCES users(id),
  link text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE vendor_activities ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX idx_vendor_activities_vendor_id ON vendor_activities(vendor_id);
CREATE INDEX idx_vendor_activities_created_at ON vendor_activities(created_at);

-- Create policies
CREATE POLICY "Vendors can view their own activities"
  ON vendor_activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE id = vendor_activities.vendor_id
      AND user_id = auth.uid()
    )
  );

-- Create function to add activity
CREATE OR REPLACE FUNCTION add_vendor_activity(
  p_vendor_id uuid,
  p_type text,
  p_title text,
  p_content text DEFAULT NULL,
  p_actor_id uuid DEFAULT NULL,
  p_link text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_activity_id uuid;
BEGIN
  INSERT INTO vendor_activities (
    vendor_id,
    type,
    title,
    content,
    actor_id,
    link
  ) VALUES (
    p_vendor_id,
    p_type,
    p_title,
    p_content,
    p_actor_id,
    p_link
  ) RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$;

-- Create triggers for various events
CREATE OR REPLACE FUNCTION log_vendor_message()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.receiver_id IN (SELECT user_id FROM vendors) THEN
    PERFORM add_vendor_activity(
      (SELECT id FROM vendors WHERE user_id = NEW.receiver_id),
      'message',
      'New message received',
      NEW.content,
      NEW.sender_id,
      '/messages'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_vendor_review()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM add_vendor_activity(
    NEW.vendor_id,
    'review',
    'New review received',
    format('Received a %s-star review', NEW.rating),
    (SELECT user_id FROM couples WHERE id = NEW.couple_id),
    '/reviews'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_vendor_booking()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM add_vendor_activity(
    NEW.vendor_id,
    'booking',
    'New booking request',
    NEW.title,
    (SELECT user_id FROM couples WHERE id = NEW.couple_id),
    '/calendar'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER on_message_received
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION log_vendor_message();

CREATE TRIGGER on_review_received
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION log_vendor_review();

CREATE TRIGGER on_booking_received
  AFTER INSERT ON appointments
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION log_vendor_booking();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON vendor_activities TO authenticated;
GRANT EXECUTE ON FUNCTION add_vendor_activity TO authenticated;