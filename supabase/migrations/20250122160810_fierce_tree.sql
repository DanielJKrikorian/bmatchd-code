-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Enable read access for users" ON users;
DROP POLICY IF EXISTS "Enable write access for admins" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create a single, simple policy for admin access
CREATE POLICY "admin_access_policy"
  ON users
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled but with simplified access
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant full permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Recreate admin user with simplified approach
DO $$ 
DECLARE 
  new_admin_id uuid;
  existing_auth_id uuid;
  existing_public_id uuid;
BEGIN
  -- Check for existing users
  SELECT id INTO existing_auth_id FROM auth.users WHERE email = 'admin@weddinghub.com';
  SELECT id INTO existing_public_id FROM public.users WHERE email = 'admin@weddinghub.com';

  -- If user exists in either table, use that ID
  IF existing_auth_id IS NOT NULL THEN
    new_admin_id := existing_auth_id;
  ELSIF existing_public_id IS NOT NULL THEN
    new_admin_id := existing_public_id;
  ELSE
    new_admin_id := gen_random_uuid();
  END IF;

  -- Delete existing entries if they exist with different IDs
  DELETE FROM auth.users WHERE email = 'admin@weddinghub.com' AND id != new_admin_id;
  DELETE FROM public.users WHERE email = 'admin@weddinghub.com' AND id != new_admin_id;

  -- Insert or update auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = new_admin_id) THEN
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
      updated_at
    )
    VALUES (
      new_admin_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@weddinghub.com',
      crypt('Admin123!', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"role": "admin"}',
      now(),
      now()
    );
  END IF;

  -- Insert or update public.users
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = new_admin_id) THEN
    INSERT INTO public.users (id, email, role)
    VALUES (new_admin_id, 'admin@weddinghub.com', 'admin');
  END IF;
END $$;