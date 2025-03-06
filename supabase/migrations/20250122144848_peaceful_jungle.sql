-- Create cities table
CREATE TABLE cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state text NOT NULL,
  country text NOT NULL DEFAULT 'USA',
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, state, country)
);

-- Create vendor service areas junction table
CREATE TABLE vendor_service_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE,
  city_id uuid REFERENCES cities(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(vendor_id, city_id)
);

-- Enable RLS
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_service_areas ENABLE ROW LEVEL SECURITY;

-- Cities policies
CREATE POLICY "Anyone can read cities"
  ON cities FOR SELECT
  TO authenticated
  USING (true);

-- Vendor service areas policies
CREATE POLICY "Anyone can read vendor service areas"
  ON vendor_service_areas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Vendors can manage their service areas"
  ON vendor_service_areas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE id = vendor_service_areas.vendor_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE id = vendor_service_areas.vendor_id
      AND user_id = auth.uid()
    )
  );

-- Insert major US cities
INSERT INTO cities (name, state) VALUES
  ('New York City', 'New York'),
  ('Los Angeles', 'California'),
  ('Chicago', 'Illinois'),
  ('Houston', 'Texas'),
  ('Phoenix', 'Arizona'),
  ('Philadelphia', 'Pennsylvania'),
  ('San Antonio', 'Texas'),
  ('San Diego', 'California'),
  ('Dallas', 'Texas'),
  ('San Jose', 'California'),
  ('Austin', 'Texas'),
  ('Jacksonville', 'Florida'),
  ('Fort Worth', 'Texas'),
  ('Columbus', 'Ohio'),
  ('San Francisco', 'California'),
  ('Charlotte', 'North Carolina'),
  ('Indianapolis', 'Indiana'),
  ('Seattle', 'Washington'),
  ('Denver', 'Colorado'),
  ('Boston', 'Massachusetts'),
  ('Las Vegas', 'Nevada'),
  ('Portland', 'Oregon'),
  ('Detroit', 'Michigan'),
  ('Memphis', 'Tennessee'),
  ('Atlanta', 'Georgia'),
  ('Miami', 'Florida'),
  ('Orlando', 'Florida'),
  ('Nashville', 'Tennessee'),
  ('New Orleans', 'Louisiana'),
  ('Minneapolis', 'Minnesota')
ON CONFLICT (name, state, country) DO NOTHING;