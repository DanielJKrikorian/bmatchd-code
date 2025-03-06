-- Add features column to vendor_packages table if it doesn't exist
ALTER TABLE vendor_packages
ADD COLUMN IF NOT EXISTS features text[] DEFAULT '{}';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_packages_features ON vendor_packages USING gin(features);

-- Add comment to document the column
COMMENT ON COLUMN vendor_packages.features IS 'Array of features included in the package';