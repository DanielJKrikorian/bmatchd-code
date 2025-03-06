-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a more reliable function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
  v_retries integer := 0;
  v_max_retries constant integer := 3;
  v_retry_delay constant float := 0.1;
BEGIN
  -- Get role from metadata with validation
  v_role := COALESCE(NULLIF(TRIM((NEW.raw_user_meta_data->>'role')::text), ''), 'couple');
  IF v_role NOT IN ('couple', 'vendor', 'admin') THEN
    v_role := 'couple';
  END IF;

  -- Insert into public.users with retry logic
  LOOP
    BEGIN
      INSERT INTO public.users (id, email, role)
      VALUES (NEW.id, NEW.email, v_role)
      ON CONFLICT (id) DO UPDATE
      SET email = EXCLUDED.email,
          role = EXCLUDED.role
      WHERE users.id = EXCLUDED.id;
      
      EXIT;
    EXCEPTION WHEN OTHERS THEN
      IF v_retries >= v_max_retries THEN
        RAISE WARNING 'Failed to create user after % attempts: %', v_max_retries, SQLERRM;
        RETURN NEW; -- Continue even if user creation fails
      END IF;
      v_retries := v_retries + 1;
      PERFORM pg_sleep(v_retry_delay * v_retries);
    END;
  END LOOP;

  -- Reset retry counter
  v_retries := 0;

  -- Create couple profile if needed
  IF v_role = 'couple' THEN
    LOOP
      BEGIN
        INSERT INTO couples (
          user_id,
          partner1_name,
          partner2_name,
          location,
          wedding_date,
          budget,
          how_we_met,
          proposal_story
        ) VALUES (
          NEW.id,
          '',
          '',
          '',
          NULL,
          NULL,
          NULL,
          NULL
        )
        ON CONFLICT (user_id) DO NOTHING;
        
        EXIT;
      EXCEPTION WHEN OTHERS THEN
        IF v_retries >= v_max_retries THEN
          RAISE WARNING 'Failed to create couple profile after % attempts: %', v_max_retries, SQLERRM;
          RETURN NEW; -- Continue even if profile creation fails
        END IF;
        v_retries := v_retries + 1;
        PERFORM pg_sleep(v_retry_delay * v_retries);
      END;
    END LOOP;
  END IF;

  -- Update auth metadata based on role
  BEGIN
    UPDATE auth.users
    SET 
      -- Skip email confirmation for couples, require it for vendors
      email_confirmed_at = CASE 
        WHEN v_role = 'couple' THEN now()
        ELSE NULL
      END,
      confirmed_at = CASE 
        WHEN v_role = 'couple' THEN now()
        ELSE NULL
      END,
      last_sign_in_at = now(),
      raw_app_meta_data = CASE 
        WHEN raw_app_meta_data IS NULL THEN
          jsonb_build_object(
            'provider', 'email',
            'providers', array['email']::text[],
            'email_confirmed', v_role = 'couple'
          )
        ELSE
          raw_app_meta_data || 
          jsonb_build_object(
            'email_confirmed', v_role = 'couple',
            'providers', array['email']::text[]
          )
      END
    WHERE id = NEW.id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to update auth user metadata: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure proper permissions
GRANT ALL ON couples TO authenticated;
GRANT ALL ON users TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_couples_user_id ON couples(user_id);