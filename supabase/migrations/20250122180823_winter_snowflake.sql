-- Drop all existing policies
DROP POLICY IF EXISTS "vendors_read_policy" ON vendors;
DROP POLICY IF EXISTS "vendors_write_policy" ON vendors;
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "users_write_policy" ON users;

-- Create a secure function to check admin status
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  );
$$;

-- Create a secure view for admin users
CREATE OR REPLACE VIEW admin_users AS
SELECT id, email, role, created_at
FROM users
WHERE is_admin();

-- Create a secure view for vendor management
CREATE OR REPLACE VIEW vendor_management AS
SELECT 
  v.*,
  u.email
FROM vendors v
JOIN users u ON v.user_id = u.id;

-- Grant access to views
GRANT SELECT ON admin_users TO authenticated;
GRANT SELECT ON vendor_management TO authenticated;

-- Create basic RLS policies without recursion
CREATE POLICY "enable_read_for_all"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "enable_write_for_self"
  ON users FOR ALL 
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "enable_read_for_all"
  ON vendors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "enable_write_for_self"
  ON vendors FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;