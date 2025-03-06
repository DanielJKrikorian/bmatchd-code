-- Drop existing policies safely
DO $$ 
BEGIN
  -- Drop policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'enable_read_for_all'
  ) THEN
    DROP POLICY "enable_read_for_all" ON users;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'enable_write_for_self'
  ) THEN
    DROP POLICY "enable_write_for_self" ON users;
  END IF;
END $$;

-- Create simplified policies for users table with unique names
CREATE POLICY "users_select_policy"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "users_update_policy"
  ON users
  FOR ALL
  TO authenticated
  USING (auth.uid() = id);

-- Ensure admin user exists with correct role
DO $$ 
DECLARE 
  admin_id uuid;
BEGIN
  -- Check if admin exists
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
    VALUES (admin_id, 'admin@bmatchd.com', 'admin')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin';
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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;