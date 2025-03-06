-- Create vendor profile views table
CREATE TABLE vendor_profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  viewer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE vendor_profile_views ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting views
CREATE POLICY "enable_insert_views"
  ON vendor_profile_views
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for vendors to view their own stats
CREATE POLICY "enable_vendor_read_views"
  ON vendor_profile_views
  FOR SELECT
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendors
      WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_profile_views_vendor ON vendor_profile_views(vendor_id);
CREATE INDEX idx_profile_views_date ON vendor_profile_views(created_at);