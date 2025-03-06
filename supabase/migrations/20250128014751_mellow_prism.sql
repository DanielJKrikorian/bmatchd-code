-- Create functions to get metrics securely
CREATE OR REPLACE FUNCTION get_vendor_metrics(vendor_id uuid)
RETURNS TABLE (
  pending_appointments bigint,
  unread_messages bigint,
  pending_leads bigint,
  saved_count bigint
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    (SELECT count(*) FROM appointments a WHERE a.vendor_id = $1 AND a.status = 'pending'),
    (SELECT count(*) FROM messages m 
     JOIN vendors v ON v.user_id = m.receiver_id 
     WHERE v.id = $1 AND m.status = 'pending'),
    (SELECT count(*) FROM leads l WHERE l.vendor_id = $1 AND l.status = 'pending'),
    (SELECT count(*) FROM saved_vendors sv WHERE sv.vendor_id = $1)
  WHERE EXISTS (
    SELECT 1 FROM vendors v 
    WHERE v.id = $1 
    AND v.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION get_couple_metrics(couple_id uuid)
RETURNS TABLE (
  pending_appointments bigint,
  unread_messages bigint,
  pending_leads bigint,
  saved_vendors bigint
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    (SELECT count(*) FROM appointments a WHERE a.couple_id = $1 AND a.status = 'pending'),
    (SELECT count(*) FROM messages m 
     JOIN couples c ON c.user_id = m.receiver_id 
     WHERE c.id = $1 AND m.status = 'pending'),
    (SELECT count(*) FROM leads l WHERE l.couple_id = $1 AND l.status = 'pending'),
    (SELECT count(*) FROM saved_vendors sv WHERE sv.couple_id = $1)
  WHERE EXISTS (
    SELECT 1 FROM couples c 
    WHERE c.id = $1 
    AND c.user_id = auth.uid()
  );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_vendor_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_couple_metrics TO authenticated;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_vendor_status ON appointments(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_couple_status ON appointments(couple_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_vendor_status ON leads(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_couple_status ON leads(couple_id, status);
CREATE INDEX IF NOT EXISTS idx_saved_vendors_vendor ON saved_vendors(vendor_id);
CREATE INDEX IF NOT EXISTS idx_saved_vendors_couple ON saved_vendors(couple_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);