-- Drop existing policies first
DROP POLICY IF EXISTS "Enable read access for all users" ON vendor_packages;
DROP POLICY IF EXISTS "Enable write access for vendors" ON vendor_packages;

-- Create vendor packages table if it doesn't exist
CREATE TABLE IF NOT EXISTS vendor_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  features text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE vendor_packages ENABLE ROW LEVEL SECURITY;

-- Create policy for vendor packages with unique names
CREATE POLICY "vendor_packages_read_policy"
  ON vendor_packages FOR SELECT
  USING (true);

CREATE POLICY "vendor_packages_write_policy"
  ON vendor_packages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE id = vendor_packages.vendor_id
      AND user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_packages_vendor_id ON vendor_packages(vendor_id);

-- Add comment to document the table
COMMENT ON TABLE vendor_packages IS 'Stores vendor service packages with pricing and features';