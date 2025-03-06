-- Drop existing triggers and functions with CASCADE to handle dependencies
DROP TRIGGER IF EXISTS on_message_create_lead ON messages CASCADE;
DROP FUNCTION IF EXISTS create_lead_from_message() CASCADE;

-- Create function to create lead from initial message
CREATE OR REPLACE FUNCTION create_lead_from_message()
RETURNS TRIGGER AS $$
DECLARE
  v_couple_id uuid;
  v_vendor_id uuid;
BEGIN
  -- Get couple ID if sender is couple
  SELECT id INTO v_couple_id
  FROM couples
  WHERE user_id = NEW.sender_id;
  
  -- Get vendor ID if receiver is vendor
  SELECT id INTO v_vendor_id
  FROM vendors
  WHERE user_id = NEW.receiver_id;
  
  -- If both IDs exist, create a lead
  IF v_couple_id IS NOT NULL AND v_vendor_id IS NOT NULL THEN
    -- Check if this is the first message in the conversation
    IF NOT EXISTS (
      SELECT 1 FROM messages 
      WHERE (sender_id = NEW.sender_id AND receiver_id = NEW.receiver_id)
      OR (sender_id = NEW.receiver_id AND receiver_id = NEW.sender_id)
      AND id != NEW.id
    ) THEN
      INSERT INTO leads (
        vendor_id,
        couple_id,
        message_id,
        status
      ) VALUES (
        v_vendor_id,
        v_couple_id,
        NEW.id,
        'pending'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new messages
CREATE TRIGGER on_message_create_lead
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_lead_from_message();

-- Create policy for leads
DROP POLICY IF EXISTS "Enable lead access for participants" ON leads;
CREATE POLICY "Enable lead access for participants"
  ON leads
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE id = vendor_id
      AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM couples
      WHERE id = couple_id
      AND user_id = auth.uid()
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_vendor_id ON leads(vendor_id);
CREATE INDEX IF NOT EXISTS idx_leads_couple_id ON leads(couple_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);