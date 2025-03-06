-- Add love story fields to couples table
ALTER TABLE couples
ADD COLUMN IF NOT EXISTS how_we_met text,
ADD COLUMN IF NOT EXISTS proposal_story text,
ADD COLUMN IF NOT EXISTS relationship_story text;

-- Add comments to document the fields
COMMENT ON COLUMN couples.how_we_met IS 'The story of how the couple first met';
COMMENT ON COLUMN couples.proposal_story IS 'The story of the marriage proposal';
COMMENT ON COLUMN couples.relationship_story IS 'What makes their relationship special';