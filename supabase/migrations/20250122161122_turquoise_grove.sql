-- Drop existing policies
DROP POLICY IF EXISTS "public_read_access" ON users;
DROP POLICY IF EXISTS "admin_write_access" ON users;

-- Create new simplified policies
CREATE POLICY "allow_read_access"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_admin_full_access"
  ON users
  FOR ALL
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

-- Create admin user
DO $$ 
DECLARE 
  admin_id uuid;
BEGIN
  -- Check if admin exists
  SELECT id INTO admin_id
  FROM auth.users
  WHERE email = 'admin@weddinghub.com';

  -- If admin doesn't exist, create it
  IF admin_id IS NULL THEN
    -- Generate new UUID
    admin_id := gen_random_uuid();

    -- Create auth user
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
      'admin@weddinghub.com',
      crypt('WeddingHub2024!', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"role": "admin"}',
      now(),
      now(),
      now(),
      encode(gen_random_bytes(32), 'hex'),
      true
    );

    -- Create public user
    INSERT INTO public.users (id, email, role)
    VALUES (admin_id, 'admin@weddinghub.com', 'admin');
  END IF;
END $$;