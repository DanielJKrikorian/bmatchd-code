-- Add read column to vendor_activities table
ALTER TABLE vendor_activities
ADD COLUMN IF NOT EXISTS read boolean DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_activities_read ON vendor_activities(read);

-- Add comment to document the column
COMMENT ON COLUMN vendor_activities.read IS 'Indicates whether the activity has been read by the vendor';

-- Update existing activities to be marked as read
UPDATE vendor_activities SET read = true WHERE created_at < now();