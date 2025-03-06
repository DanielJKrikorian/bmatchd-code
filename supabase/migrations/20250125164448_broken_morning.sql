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
      crypt('TurnPike1267!', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"role": "admin"}',
      now(),
      now(),
      now(),
      encode(gen_random_bytes(32), 'hex'),
      true
    );

    -- Insert into public.users only if it doesn't exist
    INSERT INTO public.users (id, email, role)
    VALUES (admin_id, 'admin@bmatchd.com', 'admin')
    ON CONFLICT (email) DO UPDATE
    SET role = 'admin'
    WHERE users.email = 'admin@bmatchd.com';
  ELSE
    -- Update existing admin user
    UPDATE auth.users
    SET 
      encrypted_password = crypt('TurnPike1267!', gen_salt('bf')),
      raw_user_meta_data = '{"role": "admin"}',
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      is_super_admin = true
    WHERE id = admin_id;

    -- Ensure admin exists in public.users
    INSERT INTO public.users (id, email, role)
    VALUES (admin_id, 'admin@bmatchd.com', 'admin')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin'
    WHERE users.email = 'admin@bmatchd.com';
  END IF;
END $$;