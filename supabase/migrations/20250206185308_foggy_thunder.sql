-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create minimal function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users first
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'couple')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    role = COALESCE((NEW.raw_user_meta_data->>'role')::text, users.role);

  -- Create profile based on role
  IF COALESCE((NEW.raw_user_meta_data->>'role')::text, 'couple') = 'couple' THEN
    INSERT INTO couples (
      user_id,
      partner1_name,
      partner2_name,
      location
    ) VALUES (
      NEW.id,
      '',
      '',
      ''
    )
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF COALESCE((NEW.raw_user_meta_data->>'role')::text, 'couple') = 'vendor' THEN
    INSERT INTO vendors (
      user_id,
      business_name,
      category,
      description,
      location,
      price_range,
      rating,
      images,
      email
    ) VALUES (
      NEW.id,
      '',
      '',
      '',
      '',
      'Premium',
      0,
      '{}',
      NEW.email
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Auto-confirm email
  UPDATE auth.users
  SET 
    email_confirmed_at = now(),
    confirmed_at = now(),
    last_sign_in_at = now(),
    raw_app_meta_data = jsonb_build_object(
      'provider', 'email',
      'providers', array['email']::text[],
      'email_confirmed', true
    )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Drop all existing policies first
DO $$ 
BEGIN
  -- Drop policies for users table
  DROP POLICY IF EXISTS "allow_all" ON users;
  DROP POLICY IF EXISTS "enable_auth_access" ON users;
  DROP POLICY IF EXISTS "auth_access_policy_v1" ON users;
  DROP POLICY IF EXISTS "auth_access_policy_v2" ON users;
  DROP POLICY IF EXISTS "auth_policy" ON users;
  
  -- Drop policies for vendors table
  DROP POLICY IF EXISTS "allow_all" ON vendors;
  DROP POLICY IF EXISTS "enable_auth_access" ON vendors;
  DROP POLICY IF EXISTS "auth_access_policy_v1" ON vendors;
  DROP POLICY IF EXISTS "auth_access_policy_v2" ON vendors;
  DROP POLICY IF EXISTS "auth_policy" ON vendors;
  
  -- Drop policies for couples table
  DROP POLICY IF EXISTS "allow_all" ON couples;
  DROP POLICY IF EXISTS "enable_auth_access" ON couples;
  DROP POLICY IF EXISTS "auth_access_policy_v1" ON couples;
  DROP POLICY IF EXISTS "auth_access_policy_v2" ON couples;
  DROP POLICY IF EXISTS "auth_policy" ON couples;
END $$;

-- Create maximally permissive policies for auth flow
CREATE POLICY "auth_access"
  ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "auth_access"
  ON vendors
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "auth_access"
  ON couples
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON vendors TO authenticated;
GRANT ALL ON couples TO authenticated;
GRANT SELECT ON users TO anon;
GRANT SELECT ON vendors TO anon;
GRANT SELECT ON couples TO anon;

-- Add comment to document the changes
COMMENT ON FUNCTION handle_new_user IS 'Handles new user creation with simplified error handling';