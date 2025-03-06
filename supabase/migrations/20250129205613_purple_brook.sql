-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a more reliable function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
BEGIN
  -- Get role from metadata or default to 'couple'
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::text, 'couple');

  -- Insert into public.users with retry logic
  FOR i IN 1..3 LOOP
    BEGIN
      INSERT INTO public.users (id, email, role)
      VALUES (NEW.id, NEW.email, v_role)
      ON CONFLICT (id) DO UPDATE
      SET email = EXCLUDED.email,
          role = EXCLUDED.role;
          
      EXIT; -- Exit loop if successful
    EXCEPTION WHEN OTHERS THEN
      IF i = 3 THEN RAISE; END IF; -- Re-raise on final attempt
      PERFORM pg_sleep(0.1 * i); -- Exponential backoff
    END;
  END LOOP;

  -- Create profile based on role
  IF v_role = 'couple' THEN
    FOR i IN 1..3 LOOP
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
        
        EXIT; -- Exit loop if successful
      EXCEPTION WHEN OTHERS THEN
        IF i = 3 THEN RAISE; END IF;
        PERFORM pg_sleep(0.1 * i);
      END;
    END LOOP;
  END IF;

  -- Automatically confirm email
  UPDATE auth.users
  SET 
    email_confirmed_at = now(),
    confirmed_at = now(),
    last_sign_in_at = now(),
    raw_app_meta_data = jsonb_build_object(
      'provider', 'email',
      'providers', array['email']
    )
  WHERE id = NEW.id;

  RETURN NEW;
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
DROP POLICY IF EXISTS "enable_read_access" ON users;
DROP POLICY IF EXISTS "enable_write_access" ON users;

-- Create simplified policies
CREATE POLICY "allow_read_users"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "allow_write_users"
  ON users
  FOR ALL
  TO authenticated
  USING (auth.uid() = id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;