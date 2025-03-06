-- Drop all existing policies
DROP POLICY IF EXISTS "anon_select_users" ON users;
DROP POLICY IF EXISTS "auth_update_users" ON users;
DROP POLICY IF EXISTS "anon_select_vendors" ON vendors;
DROP POLICY IF EXISTS "auth_insert_vendors" ON vendors;
DROP POLICY IF EXISTS "auth_update_vendors" ON vendors;
DROP POLICY IF EXISTS "auth_delete_vendors" ON vendors;
DROP POLICY IF EXISTS "anon_select_couples" ON couples;
DROP POLICY IF EXISTS "auth_insert_couples" ON couples;
DROP POLICY IF EXISTS "auth_update_couples" ON couples;
DROP POLICY IF EXISTS "auth_delete_couples" ON couples;

-- Create extremely simple policies for users table
CREATE POLICY "public_read_users"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "self_update_users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Create simple policies for vendors table
CREATE POLICY "public_read_vendors"
  ON vendors
  FOR SELECT
  USING (true);

CREATE POLICY "self_write_vendors"
  ON vendors
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create simple policies for couples table
CREATE POLICY "public_read_couples"
  ON couples
  FOR SELECT
  USING (true);

CREATE POLICY "self_write_couples"
  ON couples
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create simple policies for messages table
CREATE POLICY "participant_read_messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid() OR
    receiver_id = auth.uid()
  );

CREATE POLICY "sender_write_messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Create simple policies for reviews table
CREATE POLICY "public_read_reviews"
  ON reviews
  FOR SELECT
  USING (true);

-- Create simple policies for saved_vendors table
CREATE POLICY "owner_all_saved_vendors"
  ON saved_vendors
  FOR ALL
  TO authenticated
  USING (
    couple_id IN (
      SELECT id FROM couples WHERE user_id = auth.uid()
    )
  );

-- Create simple policies for appointments table
CREATE POLICY "participant_all_appointments"
  ON appointments
  FOR ALL
  TO authenticated
  USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()) OR
    couple_id IN (SELECT id FROM couples WHERE user_id = auth.uid())
  );

-- Create simple policies for service areas table
CREATE POLICY "public_read_service_areas"
  ON vendor_service_areas
  FOR SELECT
  USING (true);

CREATE POLICY "vendor_write_service_areas"
  ON vendor_service_areas
  FOR ALL
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

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