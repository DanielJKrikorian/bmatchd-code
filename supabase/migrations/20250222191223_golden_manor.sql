-- Add primary_image column to vendors table
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS primary_image integer DEFAULT 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_vendors_primary_image ON vendors(primary_image);

-- Add comment to document the column
COMMENT ON COLUMN vendors.primary_image IS 'Index of the primary profile image in the images array';

-- Update existing vendors to use first image as primary if not set
UPDATE vendors 
SET primary_image = 0 
WHERE primary_image IS NULL 
AND array_length(images, 1) > 0;