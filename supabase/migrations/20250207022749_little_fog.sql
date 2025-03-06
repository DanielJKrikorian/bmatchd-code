-- Drop existing package_limit column if it exists
ALTER TABLE vendors 
DROP COLUMN IF EXISTS package_limit;

-- Add package_limit column with fixed value of 5
ALTER TABLE vendors
ADD COLUMN package_limit integer DEFAULT 5;

-- Add comment to document the column
COMMENT ON COLUMN vendors.package_limit IS 'Number of service packages allowed (fixed at 5 for all vendors)';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_vendors_package_limit ON vendors(package_limit);