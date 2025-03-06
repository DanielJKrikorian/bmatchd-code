-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a more reliable function to handle new user creation
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
    -- Log error but continue
    RAISE WARNING 'Failed to create user record: %', SQLERRM;
  END;

  -- Create couple profile if needed
  IF v_role = 'couple' THEN
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
      -- Log error but continue
      RAISE WARNING 'Failed to create couple profile: %', SQLERRM;
    END;

    -- Auto-confirm email for couples only
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
      RAISE WARNING 'Failed to confirm email: %', SQLERRM;
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
COMMENT ON FUNCTION handle_new_user() IS 'Handles new user creation with improved error handling and auto-confirmation for couples';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Creates necessary records when a new user signs up';