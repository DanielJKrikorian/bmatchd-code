-- Drop existing functions and tables to start fresh
DROP FUNCTION IF EXISTS verify_admin_pin CASCADE;
DROP FUNCTION IF EXISTS update_admin_pin CASCADE;
DROP TABLE IF EXISTS admin_settings CASCADE;

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create admin_settings table
CREATE TABLE admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "enable_admin_settings_access"
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

-- Create function to verify admin PIN
CREATE OR REPLACE FUNCTION verify_admin_pin(pin_to_verify text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_settings
    WHERE pin_hash = crypt(pin_to_verify, pin_hash)
  );
END;
$$;

-- Create function to update admin PIN
CREATE OR REPLACE FUNCTION update_admin_pin(new_pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Update or insert PIN
  DELETE FROM admin_settings;
  INSERT INTO admin_settings (pin_hash)
  VALUES (crypt(new_pin, gen_salt('bf')));
END;
$$;

-- Set initial PIN (TurnPike1267)
DELETE FROM admin_settings;
INSERT INTO admin_settings (pin_hash)
VALUES (crypt('TurnPike1267', gen_salt('bf')));

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION verify_admin_pin TO authenticated;
GRANT EXECUTE ON FUNCTION update_admin_pin TO authenticated;

-- Add comment to document the changes
COMMENT ON TABLE admin_settings IS 'Stores admin authentication settings including PIN';
COMMENT ON FUNCTION verify_admin_pin IS 'Verifies the provided PIN against stored hash';
COMMENT ON FUNCTION update_admin_pin IS 'Updates the admin PIN with a new value';