-- Delete all vendor-related data in the correct order to maintain referential integrity
DELETE FROM saved_vendors;
DELETE FROM vendor_service_areas;
DELETE FROM reviews WHERE vendor_id IN (SELECT id FROM vendors);
DELETE FROM messages WHERE receiver_id IN (SELECT user_id FROM vendors);
DELETE FROM vendors;

-- Update users table to remove vendor role
UPDATE users 
SET role = 'couple'
WHERE role = 'vendor';

-- Log the deletion
DO $$
BEGIN
  RAISE NOTICE 'All vendor accounts and related data have been deleted';
END $$;