-- Drop existing policies
DO $$ 
BEGIN
  -- Drop users policies
  DROP POLICY IF EXISTS "read_users" ON users;
  DROP POLICY IF EXISTS "write_users" ON users;
  
  -- Drop vendors policies
  DROP POLICY IF EXISTS "read_vendors" ON vendors;
  DROP POLICY IF EXISTS "write_vendors" ON vendors;
  
  -- Drop couples policies
  DROP POLICY IF EXISTS "read_couples" ON couples;
  DROP POLICY IF EXISTS "write_couples" ON couples;
  
  -- Drop messages policies
  DROP POLICY IF EXISTS "access_messages" ON messages;
  
  -- Drop reviews policies
  DROP POLICY IF EXISTS "read_reviews" ON reviews;
  
  -- Drop saved vendors policies
  DROP POLICY IF EXISTS "access_saved_vendors" ON saved_vendors;
  
  -- Drop appointments policies
  DROP POLICY IF EXISTS "access_appointments" ON appointments;
  
  -- Drop service areas policies
  DROP POLICY IF EXISTS "read_service_areas" ON vendor_service_areas;
  DROP POLICY IF EXISTS "write_service_areas" ON vendor_service_areas;
END $$;

-- Create new simplified policies

-- Users table
CREATE POLICY "enable_select_for_authenticated"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "enable_update_for_self"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Vendors table
CREATE POLICY "enable_select_for_all"
  ON vendors FOR SELECT
  USING (true);

CREATE POLICY "enable_insert_for_self"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "enable_update_for_self"
  ON vendors FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Couples table
CREATE POLICY "enable_select_for_all"
  ON couples FOR SELECT
  USING (true);

CREATE POLICY "enable_insert_for_self"
  ON couples FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "enable_update_for_self"
  ON couples FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Messages table
CREATE POLICY "enable_select_for_participants"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() IN (sender_id, receiver_id));

CREATE POLICY "enable_insert_for_sender"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "enable_update_for_participants"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (sender_id, receiver_id));

-- Reviews table
CREATE POLICY "enable_select_for_all"
  ON reviews FOR SELECT
  USING (true);

-- Saved vendors table
CREATE POLICY "enable_all_for_couple"
  ON saved_vendors FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE id = couple_id AND user_id = auth.uid()
    )
  );

-- Appointments table
CREATE POLICY "enable_all_for_participants"
  ON appointments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors WHERE id = vendor_id AND user_id = auth.uid()
      UNION
      SELECT 1 FROM couples WHERE id = couple_id AND user_id = auth.uid()
    )
  );

-- Service areas table
CREATE POLICY "enable_select_for_all"
  ON vendor_service_areas FOR SELECT
  USING (true);

CREATE POLICY "enable_all_for_vendor"
  ON vendor_service_areas FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE id = vendor_id AND user_id = auth.uid()
    )
  );

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