-- Update leads table with additional fields
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS inquiry_type text,
ADD COLUMN IF NOT EXISTS preferred_date date,
ADD COLUMN IF NOT EXISTS budget_range text,
ADD COLUMN IF NOT EXISTS guest_count integer,
ADD COLUMN IF NOT EXISTS venue_location text,
ADD COLUMN IF NOT EXISTS additional_details text;

-- Update leads status enum
ALTER TABLE leads
DROP CONSTRAINT IF EXISTS leads_status_check,
ADD CONSTRAINT leads_status_check 
CHECK (status IN ('pending', 'accepted', 'declined', 'booked'));

-- Create function to handle lead creation from messages
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
      -- Get couple details
      INSERT INTO leads (
        vendor_id,
        couple_id,
        message_id,
        status,
        wedding_date,
        budget,
        notes,
        created_at
      )
      SELECT 
        v_vendor_id,
        v_couple_id,
        NEW.id,
        'pending',
        c.wedding_date,
        c.budget,
        NEW.content,
        now()
      FROM couples c
      WHERE c.id = v_couple_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace trigger for lead creation
DROP TRIGGER IF EXISTS on_message_create_lead ON messages;
CREATE TRIGGER on_message_create_lead
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_lead_from_message();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);