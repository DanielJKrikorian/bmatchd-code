-- Enable RLS for cities table
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read cities
CREATE POLICY "Enable read access for all authenticated users"
  ON cities
  FOR SELECT 
  TO authenticated
  USING (true);

-- Grant necessary permissions
GRANT SELECT ON cities TO authenticated;