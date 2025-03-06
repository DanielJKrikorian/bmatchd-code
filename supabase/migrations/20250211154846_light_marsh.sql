-- Add display_order column to vendor_packages table
ALTER TABLE vendor_packages
ADD COLUMN IF NOT EXISTS display_order integer;

-- Update existing packages to have sequential display_order
WITH ordered_packages AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY vendor_id ORDER BY created_at) - 1 as row_num
  FROM vendor_packages
)
UPDATE vendor_packages
SET display_order = ordered_packages.row_num
FROM ordered_packages
WHERE vendor_packages.id = ordered_packages.id;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_packages_display_order 
ON vendor_packages(vendor_id, display_order);

-- Add comment to document the column
COMMENT ON COLUMN vendor_packages.display_order IS 'Order in which packages are displayed, zero-based';