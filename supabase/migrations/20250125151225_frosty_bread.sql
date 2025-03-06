-- Update appointments table column names and comments
ALTER TABLE appointments
RENAME COLUMN start_time TO wedding_date;

ALTER TABLE appointments
RENAME COLUMN end_time TO start_time;

-- Add comments to clarify the fields
COMMENT ON COLUMN appointments.wedding_date IS 'The wedding date for the appointment';
COMMENT ON COLUMN appointments.start_time IS 'The start time for the vendor consultation';

-- Update the constraint for time validation
ALTER TABLE appointments
DROP CONSTRAINT IF EXISTS valid_time_range;

ALTER TABLE appointments
ADD CONSTRAINT valid_time_range 
CHECK (start_time > wedding_date);