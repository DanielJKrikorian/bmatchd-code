-- Drop existing problematic policies
DROP POLICY IF EXISTS "enable_read_access" ON users;
DROP POLICY IF EXISTS "enable_write_access" ON users;

-- Create simplified policies for users table
CREATE POLICY "users_read_policy"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "users_write_policy"
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
BEGIN
  -- Insert into public.users first
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'couple')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      role = EXCLUDED.role;

  -- Create couple profile if needed
  IF COALESCE((NEW.raw_user_meta_data->>'role')::text, 'couple') = 'couple' THEN
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