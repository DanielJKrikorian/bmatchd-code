-- Create leads table
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  couple_id uuid REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  wedding_date date,
  budget numeric,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_leads_vendor_id ON leads(vendor_id);
CREATE INDEX idx_leads_couple_id ON leads(couple_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);

-- Create policies
CREATE POLICY "enable_read_leads"
  ON leads
  FOR SELECT
  TO authenticated
  USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()) OR
    couple_id IN (SELECT id FROM couples WHERE user_id = auth.uid())
  );

CREATE POLICY "enable_insert_leads"
  ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    couple_id IN (SELECT id FROM couples WHERE user_id = auth.uid())
  );

CREATE POLICY "enable_update_leads"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

-- Create function to handle lead status updates
CREATE OR REPLACE FUNCTION handle_lead_status_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the message status when lead status changes
  IF NEW.status != OLD.status AND NEW.message_id IS NOT NULL THEN
    UPDATE messages
    SET status = NEW.status
    WHERE id = NEW.message_id;
  END IF;
  
  -- Update updated_at timestamp
  NEW.updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for lead status updates
CREATE TRIGGER on_lead_status_change
  BEFORE UPDATE OF status ON leads
  FOR EACH ROW
  EXECUTE FUNCTION handle_lead_status_update();

-- Create function to create lead from initial message
CREATE OR REPLACE FUNCTION create_lead_from_message()
RETURNS TRIGGER AS $$
DECLARE
  v_couple_id uuid;
  v_vendor_id uuid;
BEGIN
  -- Only create lead for initial messages from couples to vendors
  IF NEW.status = 'pending' THEN
    -- Get couple ID
    SELECT id INTO v_couple_id
    FROM couples
    WHERE user_id = NEW.sender_id;
    
    -- Get vendor ID
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
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new messages
CREATE TRIGGER on_message_create_lead
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_lead_from_message();

-- Grant necessary permissions
GRANT ALL ON leads TO authenticated;