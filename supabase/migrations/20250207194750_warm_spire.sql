-- Add vendor package relation to wedding expenses
ALTER TABLE wedding_expenses
ADD COLUMN IF NOT EXISTS vendor_package_id uuid REFERENCES vendor_packages(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_wedding_expenses_vendor_package 
ON wedding_expenses(vendor_package_id);

-- Create view for expense details
CREATE OR REPLACE VIEW expense_details AS
SELECT 
  e.*,
  v.business_name as vendor_name,
  v.category as vendor_category,
  vp.name as package_name,
  vp.description as package_description
FROM wedding_expenses e
LEFT JOIN vendors v ON v.id = e.vendor_id
LEFT JOIN vendor_packages vp ON vp.id = e.vendor_package_id;

-- Grant access to view
GRANT SELECT ON expense_details TO authenticated;

-- Add comment to document the changes
COMMENT ON COLUMN wedding_expenses.vendor_package_id IS 'Reference to the vendor package if expense is from a package';
COMMENT ON VIEW expense_details IS 'Detailed view of wedding expenses with vendor and package information';