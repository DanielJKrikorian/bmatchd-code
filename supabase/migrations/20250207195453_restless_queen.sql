-- Add image-related columns to couples table
ALTER TABLE couples
ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS primary_image integer DEFAULT 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_couples_images ON couples USING gin(images);

-- Add comments to document the columns
COMMENT ON COLUMN couples.images IS 'Array of image URLs for the couple profile';
COMMENT ON COLUMN couples.primary_image IS 'Index of the primary profile image';