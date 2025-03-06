-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
  v_user_id uuid;
BEGIN
  -- Get role from metadata with validation
  v_role := COALESCE(NULLIF(TRIM((NEW.raw_user_meta_data->>'role')::text), ''), 'couple');
  IF v_role NOT IN ('couple', 'vendor', 'admin') THEN
    v_role := 'couple';
  END IF;

  -- Start an explicit transaction
  BEGIN
    -- Insert into public.users first
    INSERT INTO public.users (id, email, role)
    VALUES (NEW.id, NEW.email, v_role)
    RETURNING id INTO v_user_id;

    -- Create profile based on role
    IF v_role = 'couple' THEN
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
    ELSIF v_role = 'vendor' THEN
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
  EXCEPTION WHEN OTHERS THEN
    -- Log error and rollback transaction
    RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Add comment to document the changes
COMMENT ON FUNCTION handle_new_user IS 'Handles new user creation with proper transaction handling and error propagation';