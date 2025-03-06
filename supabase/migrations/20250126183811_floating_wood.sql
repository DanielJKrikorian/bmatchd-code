-- Add appointment_id column to messages table if it doesn't exist
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_appointment_id ON messages(appointment_id);

-- Create function to handle appointment status updates
CREATE OR REPLACE FUNCTION handle_appointment_status_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If appointment status changes, update the associated message
  IF NEW.status != OLD.status THEN
    UPDATE messages
    SET content = CASE 
      WHEN NEW.status = 'confirmed' THEN 'Appointment confirmed'
      WHEN NEW.status = 'cancelled' THEN 'Appointment cancelled'
      ELSE content
    END
    WHERE appointment_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for appointment status updates
DROP TRIGGER IF EXISTS on_appointment_status_change ON appointments;
CREATE TRIGGER on_appointment_status_change
  AFTER UPDATE OF status ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION handle_appointment_status_update();

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "enable_appointment_access" ON appointments;

-- Create policy for appointments
CREATE POLICY "enable_appointments_access"
  ON appointments
  FOR ALL
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    ) OR
    couple_id IN (
      SELECT id FROM couples WHERE user_id = auth.uid()
    )
  );