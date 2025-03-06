-- Drop existing policies
DROP POLICY IF EXISTS "basic_read_policy" ON users;
DROP POLICY IF EXISTS "basic_write_policy" ON users;

-- Create simplified policies
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

-- Create or update admin user
DO $$ 
DECLARE 
  admin_id uuid;
BEGIN
  -- Check if admin exists in auth.users
  SELECT id INTO admin_id 
  FROM auth.users 
  WHERE email = 'admin@bmatchd.com';

  IF admin_id IS NULL THEN
    -- Create new admin user
    INSERT INTO auth.users (
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      last_sign_in_at,
      confirmation_token,
      is_super_admin
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@bmatchd.com',
      crypt('Admin123!', gen_salt('bf')),
      now(),
      jsonb_build_object(
        'provider', 'email',
        'providers', array['email']
      ),
      jsonb_build_object('role', 'admin'),
      now(),
      now(),
      now(),
      encode(gen_random_bytes(32), 'hex'),
      true
    )
    RETURNING id INTO admin_id;

    -- Create public user record
    INSERT INTO public.users (id, email, role)
    VALUES (admin_id, 'admin@bmatchd.com', 'admin');
  ELSE
    -- Update existing admin user
    UPDATE auth.users
    SET 
      encrypted_password = crypt('Admin123!', gen_salt('bf')),
      raw_user_meta_data = jsonb_build_object('role', 'admin'),
      email_confirmed_at = now(),
      is_super_admin = true,
      updated_at = now()
    WHERE id = admin_id;

    -- Update public user record
    UPDATE public.users
    SET role = 'admin'
    WHERE id = admin_id;
  END IF;

  -- Ensure email is confirmed
  UPDATE auth.users
  SET email_confirmed_at = now()
  WHERE email = 'admin@bmatchd.com'
  AND email_confirmed_at IS NULL;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;