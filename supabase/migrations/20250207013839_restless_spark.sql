-- Create vendor packages table
CREATE TABLE vendor_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE vendor_packages ENABLE ROW LEVEL SECURITY;

-- Create policy for vendor packages
CREATE POLICY "Enable read access for all users"
  ON vendor_packages FOR SELECT
  USING (true);

CREATE POLICY "Enable write access for vendors"
  ON vendor_packages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE id = vendor_packages.vendor_id
      AND user_id = auth.uid()
    )
  );

-- Add package limit column to vendors table
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS package_limit integer GENERATED ALWAYS AS (
  CASE 
    WHEN subscription_plan = 'elite' THEN 5
    WHEN subscription_plan = 'featured' THEN 3
    WHEN subscription_plan = 'essential' THEN 1
    ELSE 0
  END
) STORED;

-- Create index for better performance
CREATE INDEX idx_vendor_packages_vendor_id ON vendor_packages(vendor_id);

-- Add comment to document the table
COMMENT ON TABLE vendor_packages IS 'Stores vendor service packages with pricing';