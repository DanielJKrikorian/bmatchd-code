-- Create test vendor account
DO $$ 
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  -- First create the auth user
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
    confirmation_token
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'test5@gmail.com',
    crypt('Test123!', gen_salt('bf')),
    now(), -- Auto-confirm email
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "vendor"}',
    now(),
    now(),
    encode(gen_random_bytes(32), 'hex')
  );

  -- The trigger will automatically create the public.users entry
  -- and the empty vendor profile
END $$;