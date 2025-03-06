-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a more reliable function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users first
  BEGIN
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
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user record: %', SQLERRM;
    -- Continue execution even if user creation fails
  END;

  -- Create couple profile if needed
  IF COALESCE((NEW.raw_user_meta_data->>'role')::text, 'couple') = 'couple' THEN
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
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create couple profile: %', SQLERRM;
      -- Continue execution even if profile creation fails
    END;
  END IF;

  -- Auto-confirm email for couples
  IF COALESCE((NEW.raw_user_meta_data->>'role')::text, 'couple') = 'couple' THEN
    BEGIN
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
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to update auth user: %', SQLERRM;
    END;
  END IF;

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

-- Add comments to document the changes
COMMENT ON FUNCTION handle_new_user() IS 'Handles new user creation with improved error handling';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Creates necessary records when a new user signs up';