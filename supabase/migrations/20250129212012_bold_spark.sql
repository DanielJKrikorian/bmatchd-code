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
          role = EXCLUDED.role;
      EXIT;
    EXCEPTION WHEN OTHERS THEN
      IF v_retries >= v_max_retries THEN
        RAISE EXCEPTION 'Failed to create user after % attempts', v_max_retries;
      END IF;
      v_retries := v_retries + 1;
      PERFORM pg_sleep(v_retry_delay * v_retries);
    END;
  END LOOP;

  -- Reset retry counter
  v_retries := 0;

  -- Create profile based on role
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
          RAISE EXCEPTION 'Failed to create couple profile after % attempts', v_max_retries;
        END IF;
        v_retries := v_retries + 1;
        PERFORM pg_sleep(v_retry_delay * v_retries);
      END;
    END LOOP;
  END IF;

  -- Automatically confirm email and update metadata
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
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Update RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "allow_read_users" ON users;
DROP POLICY IF EXISTS "allow_write_users" ON users;

-- Create simplified policies
CREATE POLICY "enable_read_for_all"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "enable_write_for_self"
  ON users
  FOR ALL
  TO authenticated
  USING (auth.uid() = id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);