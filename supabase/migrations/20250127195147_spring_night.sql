-- Add appointment response fields
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS couple_response text CHECK (couple_response IN ('accepted', 'declined', null)),
ADD COLUMN IF NOT EXISTS couple_response_date timestamptz,
ADD COLUMN IF NOT EXISTS couple_notes text;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_couple_response ON appointments(couple_response);

-- Update the appointment status check constraint
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_status_check,
ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));

-- Add comment to document the changes
COMMENT ON COLUMN appointments.couple_response IS 'Couple''s response to the appointment request';
COMMENT ON COLUMN appointments.couple_response_date IS 'When the couple responded to the request';
COMMENT ON COLUMN appointments.couple_notes IS 'Any notes from the couple about the appointment';