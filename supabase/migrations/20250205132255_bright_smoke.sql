-- Drop existing problematic policies
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "users_write_policy" ON users;

-- Create simplified policies for users table
CREATE POLICY "enable_read_access"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "enable_write_access"
  ON users
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create function to handle new user creation
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
      RAISE WARNING 'Failed to create couple profile: %', SQLERRM;
    END;
  END IF;

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
    RAISE WARNING 'Failed to confirm email: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure proper permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth ON users(id, role);
CREATE INDEX IF NOT EXISTS idx_auth_users_meta ON auth.users((raw_user_meta_data->>'role'));