-- Enable RLS for cities table
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON cities;

-- Create policy to allow all users to read cities
CREATE POLICY "allow_read_cities"
  ON cities
  FOR SELECT 
  USING (true);

-- Grant necessary permissions
GRANT SELECT ON cities TO anon;
GRANT SELECT ON cities TO authenticated;