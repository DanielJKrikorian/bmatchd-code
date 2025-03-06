-- Drop and recreate review_links table with proper schema
DROP TABLE IF EXISTS review_links CASCADE;

CREATE TABLE review_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
  couple_email text NOT NULL,
  couple_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  completed_at timestamptz
);

-- Enable RLS
ALTER TABLE review_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Vendors can manage their review links"
  ON review_links
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE id = review_links.vendor_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read review links by token"
  ON review_links
  FOR SELECT
  USING (true);

-- Create function to generate review link
CREATE OR REPLACE FUNCTION generate_review_link(
  p_vendor_id uuid,
  p_couple_email text,
  p_couple_name text,
  p_expires_in interval DEFAULT interval '30 days'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token text;
BEGIN
  -- Generate unique token
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Create review link
  INSERT INTO review_links (
    vendor_id,
    couple_email,
    couple_name,
    token,
    expires_at
  ) VALUES (
    p_vendor_id,
    p_couple_email,
    p_couple_name,
    v_token,
    now() + p_expires_in
  );
  
  RETURN v_token;
END;
$$;

-- Create indexes
CREATE INDEX idx_review_links_token ON review_links(token);
CREATE INDEX idx_review_links_vendor ON review_links(vendor_id);
CREATE INDEX idx_review_links_status ON review_links(status);

-- Add comments
COMMENT ON TABLE review_links IS 'Stores review invitation links for vendors';
COMMENT ON FUNCTION generate_review_link IS 'Generates a unique review link for a vendor to send to a couple';