-- Add vendor_package_id column to wedding_expenses table
ALTER TABLE wedding_expenses
ADD COLUMN IF NOT EXISTS vendor_package_id uuid REFERENCES vendor_packages(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_wedding_expenses_vendor_package 
ON wedding_expenses(vendor_package_id);

-- Add comment to document the column
COMMENT ON COLUMN wedding_expenses.vendor_package_id IS 'Reference to the vendor package if expense is from a package';