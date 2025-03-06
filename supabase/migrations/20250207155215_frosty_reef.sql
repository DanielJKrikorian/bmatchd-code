-- Create registry items table
CREATE TABLE IF NOT EXISTS registry_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  link text,
  vendor_package_id uuid REFERENCES vendor_packages(id) ON DELETE SET NULL,
  is_purchased boolean DEFAULT false,
  purchased_by text,
  purchased_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE registry_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for couple"
  ON registry_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE id = registry_items.couple_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Enable write access for couple"
  ON registry_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE id = registry_items.couple_id
      AND user_id = auth.uid()
    )
  );

-- Add venmo_username column to couples table
ALTER TABLE couples
ADD COLUMN IF NOT EXISTS venmo_username text;

-- Create indexes for better performance
CREATE INDEX idx_registry_items_couple ON registry_items(couple_id);
CREATE INDEX idx_registry_items_vendor_package ON registry_items(vendor_package_id);
CREATE INDEX idx_registry_items_purchased ON registry_items(is_purchased);
CREATE INDEX idx_registry_items_created ON registry_items(created_at);

-- Add comment to document the table
COMMENT ON TABLE registry_items IS 'Stores wedding registry items with purchase tracking';