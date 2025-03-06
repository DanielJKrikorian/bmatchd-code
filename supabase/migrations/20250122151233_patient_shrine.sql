/*
  # Create Admin User and Policies

  1. Changes
    - Creates admin user if it doesn't exist
    - Sets up admin-specific policies for data access
    - Ensures idempotent execution

  2. Security
    - Uses secure password hashing
    - Implements proper role-based access control
    - Sets up appropriate RLS policies
*/

-- Create admin user with secure password
DO $$ 
DECLARE 
  new_user_id uuid := gen_random_uuid();
  existing_auth_user auth.users%ROWTYPE;
  existing_public_user public.users%ROWTYPE;
BEGIN
  -- First check if admin exists in auth.users
  SELECT * INTO existing_auth_user 
  FROM auth.users 
  WHERE email = 'admin';

  -- If admin doesn't exist in auth.users, create it
  IF existing_auth_user IS NULL THEN
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
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin',
      '{"provider": "email", "providers": ["email"]}',
      '{"role": "admin"}',
      false,
      crypt('HighWest1267!', gen_salt('bf')),
      now(),
      now(),
      now(),
      now()
    );

    -- Then check if admin exists in public.users
    SELECT * INTO existing_public_user 
    FROM public.users 
    WHERE email = 'admin';

    -- If admin doesn't exist in public.users, create it
    IF existing_public_user IS NULL THEN
      INSERT INTO public.users (id, email, role)
      VALUES (new_user_id, 'admin', 'admin');
    END IF;
  END IF;
END $$;

-- Create admin-specific policies
DO $$ 
BEGIN
  -- Policy for users table
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Admins have full access'
  ) THEN
    CREATE POLICY "Admins have full access"
      ON public.users
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()
          AND role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()
          AND role = 'admin'
        )
      );
  END IF;

  -- Policy for vendors table
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'vendors' 
    AND policyname = 'Admins have full access to vendors'
  ) THEN
    CREATE POLICY "Admins have full access to vendors"
      ON public.vendors
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()
          AND role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()
          AND role = 'admin'
        )
      );
  END IF;

  -- Policy for couples table
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'couples' 
    AND policyname = 'Admins have full access to couples'
  ) THEN
    CREATE POLICY "Admins have full access to couples"
      ON public.couples
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()
          AND role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()
          AND role = 'admin'
        )
      );
  END IF;
END $$;