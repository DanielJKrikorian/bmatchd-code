-- Drop all existing policies
DROP POLICY IF EXISTS "users_read" ON users;
DROP POLICY IF EXISTS "users_write" ON users;
DROP POLICY IF EXISTS "vendors_read" ON vendors;
DROP POLICY IF EXISTS "vendors_write" ON vendors;
DROP POLICY IF EXISTS "couples_read" ON couples;
DROP POLICY IF EXISTS "couples_write" ON couples;
DROP POLICY IF EXISTS "messages_access" ON messages;
DROP POLICY IF EXISTS "reviews_read" ON reviews;
DROP POLICY IF EXISTS "reviews_write" ON reviews;
DROP POLICY IF EXISTS "saved_vendors_access" ON saved_vendors;
DROP POLICY IF EXISTS "appointments_access" ON appointments;
DROP POLICY IF EXISTS "service_areas_read" ON vendor_service_areas;
DROP POLICY IF EXISTS "service_areas_write" ON vendor_service_areas;

-- Create absolute minimum policies with no joins or subqueries

-- Users - completely public read
CREATE POLICY "users_read_policy"
  ON users
  FOR SELECT
  USING (true);

-- Vendors - public read, direct user_id check for write
CREATE POLICY "vendors_read_policy"
  ON vendors
  FOR SELECT
  USING (true);

CREATE POLICY "vendors_write_policy"
  ON vendors
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Couples - public read, direct user_id check for write
CREATE POLICY "couples_read_policy"
  ON couples
  FOR SELECT
  USING (true);

CREATE POLICY "couples_write_policy"
  ON couples
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Messages - direct sender/receiver check
CREATE POLICY "messages_policy"
  ON messages
  FOR ALL
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Reviews - public read
CREATE POLICY "reviews_read_policy"
  ON reviews
  FOR SELECT
  USING (true);

-- Saved vendors - direct couple_id check
CREATE POLICY "saved_vendors_policy"
  ON saved_vendors
  FOR ALL
  TO authenticated
  USING (couple_id = auth.uid());

-- Appointments - direct vendor_id/couple_id check
CREATE POLICY "appointments_policy"
  ON appointments
  FOR ALL
  TO authenticated
  USING (vendor_id = auth.uid() OR couple_id = auth.uid());

-- Service areas - public read
CREATE POLICY "service_areas_read_policy"
  ON vendor_service_areas
  FOR SELECT
  USING (true);

CREATE POLICY "service_areas_write_policy"
  ON vendor_service_areas
  FOR ALL
  TO authenticated
  USING (vendor_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_service_areas ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;