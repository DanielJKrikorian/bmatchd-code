-- Add email and phone columns to vendors table
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text;

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(email);
CREATE INDEX IF NOT EXISTS idx_vendors_phone ON vendors(phone);

-- Add comment to document the change
COMMENT ON COLUMN vendors.email IS 'Business contact email address';
COMMENT ON COLUMN vendors.phone IS 'Business contact phone number';