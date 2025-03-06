-- Drop existing problematic functions and tables
DROP FUNCTION IF EXISTS verify_admin_pin CASCADE;
DROP FUNCTION IF EXISTS update_admin_pin CASCADE;
DROP TABLE IF EXISTS admin_settings CASCADE;

-- Create or update admin user
DO $$ 
DECLARE 
  admin_id uuid;
BEGIN
  -- First check if admin exists in auth.users
  SELECT id INTO admin_id 
  FROM auth.users 
  WHERE email = 'admin@bmatchd.com';

  IF admin_id IS NULL THEN
    -- Generate new UUID for admin user
    admin_id := gen_random_uuid();

    -- Insert into auth.users
    INSERT INTO auth.users (
      id,
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
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@bmatchd.com',
      crypt('Admin123!', gen_salt('bf')),
      now(),
      jsonb_build_object(
        'provider', 'email',
        'providers', array['email']::text[],
        'email_confirmed', true
      ),
      jsonb_build_object('role', 'admin'),
      now(),
      now(),
      now(),
      encode(gen_random_bytes(32), 'hex'),
      true
    );

    -- Insert into public.users
    INSERT INTO public.users (id, email, role)
    VALUES (admin_id, 'admin@bmatchd.com', 'admin');
  ELSE
    -- Update existing admin user
    UPDATE auth.users
    SET 
      encrypted_password = crypt('Admin123!', gen_salt('bf')),
      raw_user_meta_data = jsonb_build_object('role', 'admin'),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      is_super_admin = true,
      raw_app_meta_data = jsonb_build_object(
        'provider', 'email',
        'providers', array['email']::text[],
        'email_confirmed', true
      )
    WHERE id = admin_id;

    -- Ensure public user record exists
    INSERT INTO public.users (id, email, role)
    VALUES (admin_id, 'admin@bmatchd.com', 'admin')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin';
  END IF;
END $$;

-- Create policy for admin access
CREATE POLICY "enable_admin_access"
  ON users
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;