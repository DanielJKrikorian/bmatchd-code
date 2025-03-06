-- Add foreign key constraint for appointment_id in messages table
ALTER TABLE messages
DROP CONSTRAINT IF EXISTS messages_appointment_id_fkey,
ADD CONSTRAINT messages_appointment_id_fkey 
FOREIGN KEY (appointment_id) 
REFERENCES appointments(id) 
ON DELETE SET NULL;

-- Add comment to document the relationship
COMMENT ON CONSTRAINT messages_appointment_id_fkey ON messages IS 'Foreign key relationship between messages and appointments';