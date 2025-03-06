-- Drop existing package_limit column if it exists
ALTER TABLE vendors 
DROP COLUMN IF EXISTS package_limit;

-- Add package_limit column with correct calculation
ALTER TABLE vendors
ADD COLUMN package_limit integer GENERATED ALWAYS AS (
  CASE 
    WHEN subscription_plan = 'elite' THEN 5
    WHEN subscription_plan = 'featured' THEN 3
    WHEN subscription_plan = 'essential' THEN 1
    ELSE 0
  END
) STORED;

-- Add comment to document the column
COMMENT ON COLUMN vendors.package_limit IS 'Number of service packages allowed based on subscription plan';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_vendors_package_limit ON vendors(package_limit);