-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Allow users to read own data" ON users;
DROP POLICY IF EXISTS "Allow users to update own data" ON users;
DROP POLICY IF EXISTS "Allow admin read access" ON users;
DROP POLICY IF EXISTS "Allow admin write access" ON users;

-- Create simplified policies for users table
CREATE POLICY "Enable read access for users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable write access for admins"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure admin user exists and has correct permissions
DO $$ 
DECLARE 
  admin_id uuid;
BEGIN
  -- Check if admin exists in auth.users
  SELECT id INTO admin_id
  FROM auth.users
  WHERE email = 'admin@weddinghub.com';

  IF admin_id IS NULL THEN
    -- Create new admin user
    admin_id := gen_random_uuid();
    
    -- Insert into auth.users
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
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      jsonb_build_object('role', 'admin'),
      true,
      crypt('Admin123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      now()
    );

    -- Insert into public.users
    INSERT INTO public.users (id, email, role)
    VALUES (admin_id, 'admin@weddinghub.com', 'admin');
  END IF;
END $$;