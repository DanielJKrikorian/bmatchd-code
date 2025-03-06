-- Create admin settings table
CREATE TABLE admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admin settings
CREATE POLICY "Only admins can access settings"
  ON admin_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create function to check if admin password is set
CREATE OR REPLACE FUNCTION is_admin_password_set()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM admin_settings LIMIT 1);
$$;

-- Grant necessary permissions
GRANT ALL ON admin_settings TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_password_set TO authenticated;