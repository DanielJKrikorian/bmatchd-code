-- Drop existing vendor policies
DROP POLICY IF EXISTS "vendor_read_policy" ON vendors;
DROP POLICY IF EXISTS "vendor_write_policy" ON vendors;

-- Create simplified policies for vendors table
CREATE POLICY "enable_vendor_read"
  ON vendors
  FOR SELECT
  USING (true);

CREATE POLICY "enable_vendor_write"
  ON vendors
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved function to handle new user creation
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

  -- Create profile based on role
  CASE v_role
    WHEN 'couple' THEN
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
    WHEN 'vendor' THEN
      BEGIN
        -- Only create vendor profile if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM vendors WHERE user_id = NEW.id) THEN
          INSERT INTO vendors (
            user_id,
            business_name,
            category,
            description,
            location,
            price_range,
            rating,
            images
          ) VALUES (
            NEW.id,
            '',
            '',
            '',
            '',
            'Premium',
            0,
            '{}'
          );
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to create vendor profile: %', SQLERRM;
      END;
  END CASE;

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
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure proper permissions
GRANT ALL ON vendors TO authenticated;
GRANT SELECT ON vendors TO anon;

-- Add comment to document the changes
COMMENT ON TABLE vendors IS 'Vendor profiles with proper access control';
COMMENT ON FUNCTION handle_new_user IS 'Handles new user creation with improved error handling and duplicate prevention';