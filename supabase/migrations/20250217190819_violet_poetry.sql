-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create minimal function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
  v_retries integer := 0;
  v_max_retries constant integer := 3;
  v_retry_delay constant float := 0.1;
BEGIN
  -- Get role from metadata with fallback
  v_role := COALESCE(NULLIF(TRIM((NEW.raw_user_meta_data->>'role')::text), ''), 'couple');

  -- Insert into public.users with retry logic
  WHILE v_retries < v_max_retries LOOP
    BEGIN
      INSERT INTO public.users (id, email, role)
      VALUES (NEW.id, NEW.email, v_role);
      EXIT;
    EXCEPTION WHEN OTHERS THEN
      v_retries := v_retries + 1;
      IF v_retries = v_max_retries THEN
        RAISE LOG 'Error creating public user after % attempts: %', v_max_retries, SQLERRM;
      ELSE
        PERFORM pg_sleep(v_retry_delay * v_retries);
        CONTINUE;
      END IF;
    END;
  END LOOP;

  -- Auto-confirm email
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
    RAISE LOG 'Error confirming email: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Add comment to document the changes
COMMENT ON FUNCTION handle_new_user IS 'Minimal user creation handler with retry logic';