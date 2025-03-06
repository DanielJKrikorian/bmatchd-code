-- Drop all existing policies
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "vendors_read_policy" ON vendors;
DROP POLICY IF EXISTS "vendors_write_policy" ON vendors;
DROP POLICY IF EXISTS "couples_read_policy" ON couples;
DROP POLICY IF EXISTS "couples_write_policy" ON couples;
DROP POLICY IF EXISTS "messages_policy" ON messages;
DROP POLICY IF EXISTS "reviews_read_policy" ON reviews;
DROP POLICY IF EXISTS "saved_vendors_policy" ON saved_vendors;
DROP POLICY IF EXISTS "appointments_policy" ON appointments;
DROP POLICY IF EXISTS "service_areas_read_policy" ON vendor_service_areas;
DROP POLICY IF EXISTS "service_areas_write_policy" ON vendor_service_areas;

-- Create the absolute minimum policies possible

-- Users table - completely public read
CREATE POLICY "read_users"
  ON users
  FOR SELECT
  USING (true);

-- Vendors table - public read, direct id check
CREATE POLICY "read_vendors"
  ON vendors
  FOR SELECT
  USING (true);

CREATE POLICY "write_vendors"
  ON vendors
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Couples table - public read, direct id check
CREATE POLICY "read_couples"
  ON couples
  FOR SELECT
  USING (true);

CREATE POLICY "write_couples"
  ON couples
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Messages table - direct id check
CREATE POLICY "access_messages"
  ON messages
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (sender_id, receiver_id));

-- Reviews table - public read
CREATE POLICY "read_reviews"
  ON reviews
  FOR SELECT
  USING (true);

-- Saved vendors table - direct id check
CREATE POLICY "access_saved_vendors"
  ON saved_vendors
  FOR ALL
  TO authenticated
  USING (auth.uid() = couple_id);

-- Appointments table - direct id check
CREATE POLICY "access_appointments"
  ON appointments
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (vendor_id, couple_id));

-- Service areas table - public read
CREATE POLICY "read_service_areas"
  ON vendor_service_areas
  FOR SELECT
  USING (true);

CREATE POLICY "write_service_areas"
  ON vendor_service_areas
  FOR ALL
  TO authenticated
  USING (auth.uid() = vendor_id);

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