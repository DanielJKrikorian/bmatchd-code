-- Add admin role to role check constraint
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_role_check,
ADD CONSTRAINT users_role_check 
CHECK (role IN ('couple', 'vendor', 'admin'));

-- Create admin users view for enhanced security
CREATE VIEW admin_users AS
SELECT id, email, role, created_at
FROM users
WHERE role = 'admin';

-- Grant access to admin users view
GRANT SELECT ON admin_users TO authenticated;

-- Create policy for admin access
CREATE POLICY "Admins can access all data"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);