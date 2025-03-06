/*
  # Add Admin User Migration
  
  1. Changes
    - Creates admin user with secure credentials
    - Sets up admin role and permissions
    - Adds necessary RLS policies
  
  2. Security
    - Password is securely hashed
    - Admin role has restricted access
*/

-- Create admin user with secure password
INSERT INTO auth.users (
  instance_id,
  id,
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
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
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

-- Add admin user to public.users table
INSERT INTO public.users (
  id,
  email,
  role
)
SELECT 
  id,
  email,
  'admin'
FROM auth.users
WHERE email = 'admin'
AND NOT EXISTS (
  SELECT 1 FROM public.users WHERE email = 'admin'
);

-- Create admin-specific policies
DO $$ 
BEGIN
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
END $$;