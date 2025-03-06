-- Add foreign key constraints for vendors and couples tables
ALTER TABLE vendors 
ADD CONSTRAINT fk_vendors_users 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

ALTER TABLE couples 
ADD CONSTRAINT fk_couples_users 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- Add comment to document the constraints
COMMENT ON CONSTRAINT fk_vendors_users ON vendors IS 'Foreign key constraint linking vendors to users';
COMMENT ON CONSTRAINT fk_couples_users ON couples IS 'Foreign key constraint linking couples to users';