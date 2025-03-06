-- Drop all existing policies
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "users_write_policy" ON users;
DROP POLICY IF EXISTS "vendors_read_policy" ON vendors;
DROP POLICY IF EXISTS "vendors_write_policy" ON vendors;

-- Create basic read-only policy for users
CREATE POLICY "users_select"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Create basic write policy for users
CREATE POLICY "users_write"
  ON users
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create basic read-only policy for vendors
CREATE POLICY "vendors_select"
  ON vendors
  FOR SELECT
  TO authenticated
  USING (true);

-- Create basic write policy for vendors
CREATE POLICY "vendors_write"
  ON vendors
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Grant basic permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;