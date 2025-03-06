-- Add status column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended'));

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Add comment to document the column
COMMENT ON COLUMN users.status IS 'User account status (active/suspended)';