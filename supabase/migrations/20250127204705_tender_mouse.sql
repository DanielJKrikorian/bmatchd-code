-- Drop existing policies safely
DO $$ 
BEGIN
  -- Drop policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'users_select_policy'
  ) THEN
    DROP POLICY "users_select_policy" ON users;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'users_update_policy'
  ) THEN
    DROP POLICY "users_update_policy" ON users;
  END IF;
END $$;

-- Create simplified policies for users table
CREATE POLICY "allow_read_users"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "allow_update_users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create admin user with proper configuration
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
      crypt('TurnPike1267!', gen_salt('bf')),
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
    );

    -- Insert into public.users
    INSERT INTO public.users (id, email, role)
    VALUES (admin_id, 'admin@bmatchd.com', 'admin');
  ELSE
    -- Update existing admin user
    UPDATE auth.users
    SET 
      encrypted_password = crypt('TurnPike1267!', gen_salt('bf')),
      raw_user_meta_data = jsonb_build_object('role', 'admin'),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      is_super_admin = true,
      updated_at = now()
    WHERE id = admin_id;

    -- Update public user record
    UPDATE public.users
    SET role = 'admin'
    WHERE id = admin_id;
  END IF;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;