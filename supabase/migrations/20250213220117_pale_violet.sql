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
  v_retry_delay constant float := 0.1;
  v_vendor_id uuid;
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
        role = v_role;
      
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
      PERFORM pg_sleep(v_retry_delay * v_retries);
    END;
  END LOOP;

  -- Reset retry counter
  v_retries := 0;

  -- Create profile based on role with retry logic
  CASE v_role
    WHEN 'couple' THEN
      -- Create couple profile
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
          PERFORM pg_sleep(v_retry_delay * v_retries);
        END;
      END LOOP;

    WHEN 'vendor' THEN
      -- Create vendor profile
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
            email,
            subscription_plan
          ) VALUES (
            NEW.id,
            '',
            '',
            '',
            '',
            'Premium',
            0,
            '{}',
            NEW.email,
            NULL
          )
          RETURNING id INTO v_vendor_id;

          -- Create welcome notification for new vendor
          INSERT INTO notifications (
            user_id,
            type,
            title,
            content,
            link,
            sender_name,
            recipient_name
          ) VALUES (
            NEW.id,
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
          PERFORM pg_sleep(v_retry_delay * v_retries);
        END;
      END LOOP;
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
    ),
    raw_user_meta_data = jsonb_build_object(
      'role', v_role
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
COMMENT ON FUNCTION handle_new_user IS 'Handles new user creation with proper role-based profile initialization';