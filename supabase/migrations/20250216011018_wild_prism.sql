-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
  v_user_id uuid;
  v_retries integer := 0;
  v_max_retries constant integer := 3;
BEGIN
  -- Get role from metadata with validation
  v_role := COALESCE(NULLIF(TRIM((NEW.raw_user_meta_data->>'role')::text), ''), 'couple');
  IF v_role NOT IN ('couple', 'vendor', 'admin') THEN
    v_role := 'couple';
  END IF;

  -- Insert into public.users first with retry logic
  WHILE v_retries < v_max_retries LOOP
    BEGIN
      INSERT INTO public.users (id, email, role)
      VALUES (NEW.id, NEW.email, v_role)
      RETURNING id INTO v_user_id;
      
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
          v_user_id,
          '',
          '',
          ''
        );
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
          v_user_id,
          '',
          '',
          '',
          '',
          'Premium',
          0,
          '{}',
          NEW.email
        );

        -- Create welcome notification
        INSERT INTO notifications (
          user_id,
          type,
          title,
          content,
          link,
          sender_name,
          recipient_name
        ) VALUES (
          v_user_id,
          'welcome',
          'Welcome to BMATCHD!',
          'To start receiving leads and connecting with couples, please select a subscription plan.',
          '/subscription',
          'BMATCHD',
          ''
        );
        
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Add comment to document the changes
COMMENT ON FUNCTION handle_new_user IS 'Handles new user creation with improved error handling and retry logic';