-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
  v_vendor_id uuid;
BEGIN
  -- Get role from metadata with validation
  v_role := COALESCE(NULLIF(TRIM((NEW.raw_user_meta_data->>'role')::text), ''), 'couple');
  IF v_role NOT IN ('couple', 'vendor', 'admin') THEN
    v_role := 'couple';
  END IF;

  -- Insert into public.users first
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, v_role);

  -- Create profile based on role
  IF v_role = 'couple' THEN
    -- Create couple profile
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
    );
  ELSIF v_role = 'vendor' THEN
    -- Create vendor profile and get the ID
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
    RETURNING id INTO v_vendor_id;

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
      NEW.id,
      'welcome',
      'Welcome to BMATCHD!',
      'Your account is ready. Start connecting with couples and managing your business.',
      '/dashboard',
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
  -- Log error but don't fail
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Add comment to document the changes
COMMENT ON FUNCTION handle_new_user IS 'Handles new user creation with proper profile initialization';