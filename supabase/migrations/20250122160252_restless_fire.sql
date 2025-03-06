-- Create admin user with secure password
DO $$ 
DECLARE 
  admin_id uuid;
BEGIN
  -- Check if admin exists in public.users
  SELECT id INTO admin_id
  FROM public.users
  WHERE email = 'admin@weddinghub.com'
  AND role = 'admin';

  -- If admin doesn't exist, create new user
  IF admin_id IS NULL THEN
    -- Generate new UUID
    admin_id := gen_random_uuid();

    -- Insert into public.users first
    INSERT INTO public.users (id, email, role)
    VALUES (admin_id, 'admin@weddinghub.com', 'admin');

    -- Then insert into auth.users if not exists
    IF NOT EXISTS (
      SELECT 1 FROM auth.users WHERE email = 'admin@weddinghub.com'
    ) THEN
      INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        last_sign_in_at
      )
      VALUES (
        admin_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'admin@weddinghub.com',
        jsonb_build_object(
          'provider', 'email',
          'providers', array['email']
        ),
        jsonb_build_object('role', 'admin'),
        false,
        crypt('Admin123!', gen_salt('bf')),
        now(),
        now(),
        now(),
        now()
      );
    END IF;
  END IF;

  -- Ensure proper permissions are set
  GRANT USAGE ON SCHEMA public TO authenticated;
  GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
  GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
END $$;