-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
BEGIN
  -- Get role from metadata with validation
  v_role := COALESCE(NULLIF(TRIM((NEW.raw_user_meta_data->>'role')::text), ''), 'couple');
  IF v_role NOT IN ('couple', 'vendor', 'admin') THEN
    v_role := 'couple';
  END IF;

  -- Insert into public.users first
  BEGIN
    INSERT INTO public.users (id, email, role)
    VALUES (NEW.id, NEW.email, v_role)
    ON CONFLICT (id) DO UPDATE
    SET 
      email = EXCLUDED.email,
      role = v_role;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user record: %', SQLERRM;
  END;

  -- Create profile based on role
  IF v_role = 'couple' THEN
    BEGIN
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
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create couple profile: %', SQLERRM;
    END;
  ELSIF v_role = 'vendor' THEN
    BEGIN
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
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create vendor profile: %', SQLERRM;
    END;
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

-- Drop existing policies first
DO $$ 
BEGIN
  -- Drop policies for users table
  DROP POLICY IF EXISTS "users_signup_policy" ON users;
  DROP POLICY IF EXISTS "enable_signup_access" ON users;
  
  -- Drop policies for vendors table
  DROP POLICY IF EXISTS "vendors_signup_policy" ON vendors;
  DROP POLICY IF EXISTS "enable_signup_access" ON vendors;
  
  -- Drop policies for couples table
  DROP POLICY IF EXISTS "couples_signup_policy" ON couples;
  DROP POLICY IF EXISTS "enable_signup_access" ON couples;
END $$;

-- Create new policies with unique names
CREATE POLICY "users_signup_policy_v4"
  ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "vendors_signup_policy_v4"
  ON vendors
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "couples_signup_policy_v4"
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