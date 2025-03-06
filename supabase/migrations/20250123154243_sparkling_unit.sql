-- Drop all existing policies
DROP POLICY IF EXISTS "public_read_users" ON users;
DROP POLICY IF EXISTS "self_update_users" ON users;
DROP POLICY IF EXISTS "public_read_vendors" ON vendors;
DROP POLICY IF EXISTS "self_write_vendors" ON vendors;
DROP POLICY IF EXISTS "public_read_couples" ON couples;
DROP POLICY IF EXISTS "self_write_couples" ON couples;
DROP POLICY IF EXISTS "participant_read_messages" ON messages;
DROP POLICY IF EXISTS "sender_write_messages" ON messages;
DROP POLICY IF EXISTS "public_read_reviews" ON reviews;
DROP POLICY IF EXISTS "owner_all_saved_vendors" ON saved_vendors;
DROP POLICY IF EXISTS "participant_all_appointments" ON appointments;
DROP POLICY IF EXISTS "public_read_service_areas" ON vendor_service_areas;
DROP POLICY IF EXISTS "vendor_write_service_areas" ON vendor_service_areas;

-- Create final, simplified policies

-- Users table
CREATE POLICY "allow_public_read_users"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "allow_self_update_users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Vendors table
CREATE POLICY "allow_public_read_vendors"
  ON vendors
  FOR SELECT
  USING (true);

CREATE POLICY "allow_self_write_vendors"
  ON vendors
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Couples table
CREATE POLICY "allow_public_read_couples"
  ON couples
  FOR SELECT
  USING (true);

CREATE POLICY "allow_self_write_couples"
  ON couples
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Messages table
CREATE POLICY "allow_participant_messages"
  ON messages
  FOR ALL
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Reviews table
CREATE POLICY "allow_public_read_reviews"
  ON reviews
  FOR SELECT
  USING (true);

CREATE POLICY "allow_couple_write_reviews"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM couples
    WHERE id = couple_id
    AND user_id = auth.uid()
  ));

-- Saved vendors table
CREATE POLICY "allow_couple_saved_vendors"
  ON saved_vendors
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM couples
    WHERE id = couple_id
    AND user_id = auth.uid()
  ));

-- Appointments table
CREATE POLICY "allow_participant_appointments"
  ON appointments
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM vendors WHERE id = vendor_id AND user_id = auth.uid()
    UNION
    SELECT 1 FROM couples WHERE id = couple_id AND user_id = auth.uid()
  ));

-- Service areas table
CREATE POLICY "allow_public_read_service_areas"
  ON vendor_service_areas
  FOR SELECT
  USING (true);

CREATE POLICY "allow_vendor_write_service_areas"
  ON vendor_service_areas
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM vendors
    WHERE id = vendor_id
    AND user_id = auth.uid()
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