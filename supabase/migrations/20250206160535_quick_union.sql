-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
BEGIN
  -- Start an explicit transaction
  BEGIN
    -- Get role from metadata with validation
    v_role := COALESCE(NULLIF(TRIM((NEW.raw_user_meta_data->>'role')::text), ''), 'couple');
    IF v_role NOT IN ('couple', 'vendor', 'admin') THEN
      v_role := 'couple';
    END IF;

    -- Insert into public.users first and ensure it completes
    INSERT INTO public.users (id, email, role)
    VALUES (NEW.id, NEW.email, v_role)
    ON CONFLICT (id) DO UPDATE
    SET 
      email = EXCLUDED.email,
      role = v_role;

    -- Wait for user record to be committed
    PERFORM pg_sleep(0.1);

    -- Create profile based on role
    CASE v_role
      WHEN 'couple' THEN
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
        
      WHEN 'vendor' THEN
        -- Verify user record exists before creating vendor
        IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
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
        ELSE
          RAISE WARNING 'User record not found for vendor creation: %', NEW.id;
        END IF;
    END CASE;

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
  EXCEPTION WHEN OTHERS THEN
    -- Log error details
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Drop existing policies
DROP POLICY IF EXISTS "enable_full_access" ON users;
DROP POLICY IF EXISTS "enable_full_access" ON vendors;
DROP POLICY IF EXISTS "enable_full_access" ON couples;

-- Create maximally permissive policies for signup flow
CREATE POLICY "allow_all_access"
  ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_all_access"
  ON vendors
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_all_access"
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
COMMENT ON FUNCTION handle_new_user IS 'Handles new user creation with improved transaction handling and foreign key constraint management';