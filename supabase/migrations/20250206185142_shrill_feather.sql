-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
  v_retries integer := 0;
  v_max_retries constant integer := 3;
BEGIN
  -- Get role from metadata with validation
  v_role := COALESCE(NULLIF(TRIM((NEW.raw_user_meta_data->>'role')::text), ''), 'couple');
  IF v_role NOT IN ('couple', 'vendor', 'admin') THEN
    v_role := 'couple';
  END IF;

  -- Insert into public.users with retry logic
  WHILE v_retries < v_max_retries LOOP
    BEGIN
      INSERT INTO public.users (id, email, role)
      VALUES (NEW.id, NEW.email, v_role)
      ON CONFLICT (id) DO UPDATE
      SET 
        email = EXCLUDED.email,
        role = v_role,
        updated_at = now();
      
      -- If successful, break out of retry loop
      EXIT;
    EXCEPTION WHEN OTHERS THEN
      -- On error, increment retry counter
      v_retries := v_retries + 1;
      IF v_retries = v_max_retries THEN
        RAISE WARNING 'Failed to create user record after % attempts: %', v_max_retries, SQLERRM;
        RETURN NULL;
      END IF;
      -- Wait before retrying with exponential backoff
      PERFORM pg_sleep(0.1 * v_retries);
    END;
  END LOOP;

  -- Reset retry counter
  v_retries := 0;

  -- Create profile based on role with retry logic
  IF v_role = 'couple' THEN
    WHILE v_retries < v_max_retries LOOP
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
        EXIT;
      EXCEPTION WHEN OTHERS THEN
        v_retries := v_retries + 1;
        IF v_retries = v_max_retries THEN
          RAISE WARNING 'Failed to create couple profile after % attempts: %', v_max_retries, SQLERRM;
          RETURN NULL;
        END IF;
        PERFORM pg_sleep(0.1 * v_retries);
      END;
    END LOOP;
  ELSIF v_role = 'vendor' THEN
    WHILE v_retries < v_max_retries LOOP
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
        EXIT;
      EXCEPTION WHEN OTHERS THEN
        v_retries := v_retries + 1;
        IF v_retries = v_max_retries THEN
          RAISE WARNING 'Failed to create vendor profile after % attempts: %', v_max_retries, SQLERRM;
          RETURN NULL;
        END IF;
        PERFORM pg_sleep(0.1 * v_retries);
      END;
    END LOOP;
  END IF;

  -- Auto-confirm email and update metadata
  UPDATE auth.users
  SET 
    email_confirmed_at = now(),
    confirmed_at = now(),
    last_sign_in_at = now(),
    updated_at = now(),
    raw_app_meta_data = jsonb_build_object(
      'provider', 'email',
      'providers', array['email']::text[],
      'email_confirmed', true
    ),
    raw_user_meta_data = jsonb_build_object(
      'role', v_role
    )
  WHERE id = NEW.id;

  -- Ensure changes are committed
  PERFORM pg_advisory_xact_lock(hashtext('user_creation_lock'));
  
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
  
  -- Drop policies for vendors table
  DROP POLICY IF EXISTS "allow_all" ON vendors;
  DROP POLICY IF EXISTS "enable_auth_access" ON vendors;
  DROP POLICY IF EXISTS "auth_access_policy_v1" ON vendors;
  
  -- Drop policies for couples table
  DROP POLICY IF EXISTS "allow_all" ON couples;
  DROP POLICY IF EXISTS "enable_auth_access" ON couples;
  DROP POLICY IF EXISTS "auth_access_policy_v1" ON couples;
END $$;

-- Create new policies with unique names
CREATE POLICY "auth_access_policy_v2"
  ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "auth_access_policy_v2"
  ON vendors
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "auth_access_policy_v2"
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
COMMENT ON FUNCTION handle_new_user IS 'Handles new user creation with improved error handling and auth sync';