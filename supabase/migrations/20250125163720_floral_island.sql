-- Drop existing policies
DROP POLICY IF EXISTS "allow_read_users" ON users;
DROP POLICY IF EXISTS "allow_insert_users" ON users;
DROP POLICY IF EXISTS "allow_update_users" ON users;

-- Create admin-aware policies for users table
CREATE POLICY "enable_read_for_all"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "enable_write_for_admins"
  ON users
  FOR ALL
  TO authenticated
  USING (
    role = 'admin' OR
    auth.uid() = id
  );

-- Ensure admin user exists with correct role and password
DO $$ 
DECLARE 
  admin_id uuid;
BEGIN
  -- Get existing admin user if any
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
      crypt('TurnPike1267!', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"role": "admin"}',
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
      encrypted_password = crypt('TurnPike1267!', gen_salt('bf')),
      raw_user_meta_data = '{"role": "admin"}',
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      is_super_admin = true
    WHERE id = admin_id;

    -- Ensure public user record exists
    INSERT INTO public.users (id, email, role)
    VALUES (admin_id, 'admin@bmatchd.com', 'admin')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin';
  END IF;
END $$;