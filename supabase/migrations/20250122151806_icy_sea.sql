-- Update admin user email in auth.users
UPDATE auth.users 
SET email = 'admin@weddinghub.com'
WHERE email = 'admin';

-- Update admin user email in public.users
UPDATE public.users
SET email = 'admin@weddinghub.com'
WHERE email = 'admin';