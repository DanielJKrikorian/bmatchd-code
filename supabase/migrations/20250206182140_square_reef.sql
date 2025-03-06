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
  );

  -- Create vendor profile if needed
  IF COALESCE((NEW.raw_user_meta_data->>'role')::text, 'couple') = 'vendor' THEN
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
    );
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

-- Drop all existing policies
DROP POLICY IF EXISTS "allow_all" ON users;
DROP POLICY IF EXISTS "allow_all" ON vendors;
DROP POLICY IF EXISTS "allow_all" ON couples;

-- Create maximally permissive policies for signup flow
CREATE POLICY "allow_all"
  ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_all"
  ON vendors
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_all"
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