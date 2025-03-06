-- Drop existing trigger and function
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
  VALUES (NEW.id, NEW.email, v_role);

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
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Drop existing policies
DROP POLICY IF EXISTS "enable_couples_manage" ON couples;

-- Create policies for couples table
CREATE POLICY "enable_couples_select"
  ON couples
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "enable_couples_insert"
  ON couples
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "enable_couples_update"
  ON couples
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON couples TO authenticated;