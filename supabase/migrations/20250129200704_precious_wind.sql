-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
BEGIN
  -- Get role from metadata or default to 'couple'
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::text, 'couple');

  -- Insert into public.users
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, v_role)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      role = EXCLUDED.role;

  -- Create empty couple profile if role is couple
  IF v_role = 'couple' THEN
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create policy for couples to manage their own data
CREATE POLICY "enable_couples_manage"
  ON couples
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Grant necessary permissions
GRANT ALL ON couples TO authenticated;