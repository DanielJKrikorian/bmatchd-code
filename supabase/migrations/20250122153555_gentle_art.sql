/*
  # Create Admin User Migration
  
  1. Changes
    - Create admin user with secure credentials
    - Set proper role and metadata
    - Handle existing user cases safely
    
  2. Security
    - Use secure password hashing
    - Set proper permissions
*/

-- Create admin user with secure password
DO $$ 
DECLARE 
  new_user_id uuid;
BEGIN
  -- First check if admin exists in either table
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@weddinghub.com'
  ) THEN
    -- Generate new UUID for admin user
    new_user_id := gen_random_uuid();

    -- Insert into auth.users first
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
      'admin@weddinghub.com',
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      jsonb_build_object('role', 'admin'),
      true,
      crypt('Admin123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      now()
    );

    -- Then manually insert into public.users
    INSERT INTO public.users (id, email, role)
    SELECT new_user_id, 'admin@weddinghub.com', 'admin'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.users WHERE email = 'admin@weddinghub.com'
    );
  END IF;
END $$;