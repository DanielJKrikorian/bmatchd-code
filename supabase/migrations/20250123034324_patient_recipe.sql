-- Drop existing policies first
DROP POLICY IF EXISTS "enable_read_for_authenticated" ON users;
DROP POLICY IF EXISTS "enable_read_for_all" ON vendors;
DROP POLICY IF EXISTS "enable_insert_for_authenticated" ON vendors;
DROP POLICY IF EXISTS "enable_update_for_owner" ON vendors;
DROP POLICY IF EXISTS "enable_delete_for_owner" ON vendors;
DROP POLICY IF EXISTS "enable_all_for_vendor" ON vendor_service_areas;

-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Now we can safely drop and recreate the function
DROP FUNCTION IF EXISTS handle_auth_user_created();

-- Create a secure function to handle new user creation
CREATE OR REPLACE FUNCTION handle_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Get role from metadata or default to 'couple'
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'couple')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      role = EXCLUDED.role
  WHERE users.id = EXCLUDED.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger for auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_auth_user_created();

-- Create simple policies for users table
CREATE POLICY "allow_read_users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_update_own_user"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create simple policies for vendors table
CREATE POLICY "allow_read_vendors"
  ON vendors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_manage_own_vendor"
  ON vendors
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create simple policy for service areas
CREATE POLICY "allow_manage_service_areas"
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

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_service_areas ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;