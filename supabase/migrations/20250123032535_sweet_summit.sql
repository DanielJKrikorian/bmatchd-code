-- Drop all existing policies
DROP POLICY IF EXISTS "allow_read" ON users;
DROP POLICY IF EXISTS "allow_insert" ON users;
DROP POLICY IF EXISTS "allow_vendor_read" ON vendors;
DROP POLICY IF EXISTS "allow_vendor_write" ON vendors;
DROP POLICY IF EXISTS "allow_service_areas" ON vendor_service_areas;

-- Create a trigger function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'couple')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_auth_user();

-- Create minimal policies for users table
CREATE POLICY "allow_public_read"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Create minimal policies for vendors table
CREATE POLICY "allow_vendor_read"
  ON vendors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_vendor_write"
  ON vendors
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create minimal policy for service areas
CREATE POLICY "allow_service_areas"
  ON vendor_service_areas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors 
      WHERE id = vendor_service_areas.vendor_id 
      AND user_id = auth.uid()
    )
  );

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_service_areas ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;