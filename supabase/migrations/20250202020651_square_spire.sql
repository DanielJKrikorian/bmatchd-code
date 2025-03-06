-- Create notification preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS notification_preferences (
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

-- Add unique constraint on user_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'notification_preferences_user_id_key'
  ) THEN
    ALTER TABLE notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own preferences" ON notification_preferences;

-- Create new policies with unique names
CREATE POLICY "enable_read_own_preferences"
  ON notification_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "enable_update_own_preferences"
  ON notification_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "enable_insert_own_preferences"
  ON notification_preferences
  FOR INSERT
  TO authenticated
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
DROP TRIGGER IF EXISTS on_user_created ON users;
CREATE TRIGGER on_user_created
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_notification_preferences();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id 
ON notification_preferences(user_id);

-- Add comments
COMMENT ON TABLE notification_preferences IS 'Stores user notification preferences';
COMMENT ON COLUMN notification_preferences.user_id IS 'References the user who owns these preferences';