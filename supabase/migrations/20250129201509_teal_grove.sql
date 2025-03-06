-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

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
  );

  -- If role is couple, create couple profile
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
    );
  END IF;

  -- Automatically confirm email
  UPDATE auth.users
  SET email_confirmed_at = now(),
      confirmed_at = now()
  WHERE id = NEW.id;

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