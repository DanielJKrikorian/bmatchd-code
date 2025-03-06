-- Drop all existing policies
DROP POLICY IF EXISTS "allow_public_read_users" ON users;
DROP POLICY IF EXISTS "allow_self_update_users" ON users;
DROP POLICY IF EXISTS "allow_public_read_vendors" ON vendors;
DROP POLICY IF EXISTS "allow_self_write_vendors" ON vendors;
DROP POLICY IF EXISTS "allow_public_read_couples" ON couples;
DROP POLICY IF EXISTS "allow_self_write_couples" ON couples;
DROP POLICY IF EXISTS "allow_participant_messages" ON messages;
DROP POLICY IF EXISTS "allow_public_read_reviews" ON reviews;
DROP POLICY IF EXISTS "allow_couple_write_reviews" ON reviews;
DROP POLICY IF EXISTS "allow_couple_saved_vendors" ON saved_vendors;
DROP POLICY IF EXISTS "allow_participant_appointments" ON appointments;
DROP POLICY IF EXISTS "allow_public_read_service_areas" ON vendor_service_areas;
DROP POLICY IF EXISTS "allow_vendor_write_service_areas" ON vendor_service_areas;

-- Create maximally simplified policies without any joins or subqueries

-- Users table - completely public read, self-only write
CREATE POLICY "users_read"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_write"
  ON users
  FOR ALL
  TO authenticated
  USING (auth.uid() = id);

-- Vendors table - public read, self-only write
CREATE POLICY "vendors_read"
  ON vendors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "vendors_write"
  ON vendors
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Couples table - public read, self-only write
CREATE POLICY "couples_read"
  ON couples
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "couples_write"
  ON couples
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Messages table - participants only
CREATE POLICY "messages_access"
  ON messages
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (sender_id, receiver_id));

-- Reviews table - public read, simple write check
CREATE POLICY "reviews_read"
  ON reviews
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "reviews_write"
  ON reviews
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (
    SELECT user_id FROM couples WHERE id = couple_id
  ));

-- Saved vendors table - simple ownership check
CREATE POLICY "saved_vendors_access"
  ON saved_vendors
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (
    SELECT user_id FROM couples WHERE id = couple_id
  ));

-- Appointments table - simple participant check
CREATE POLICY "appointments_access"
  ON appointments
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (
    SELECT user_id FROM vendors WHERE id = vendor_id
    UNION
    SELECT user_id FROM couples WHERE id = couple_id
  ));

-- Service areas table - public read, vendor-only write
CREATE POLICY "service_areas_read"
  ON vendor_service_areas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "service_areas_write"
  ON vendor_service_areas
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (
    SELECT user_id FROM vendors WHERE id = vendor_id
  ));

-- Ensure RLS is enabled for all tables
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