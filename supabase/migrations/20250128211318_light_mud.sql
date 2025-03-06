-- Add message_thread_id to leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS message_thread_id uuid REFERENCES message_threads(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_leads_message_thread ON leads(message_thread_id);

-- Add comment to document the relationship
COMMENT ON COLUMN leads.message_thread_id IS 'Reference to the associated message thread';