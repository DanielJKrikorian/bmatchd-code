-- Add venue and hotel related columns to couples table
ALTER TABLE couples
ADD COLUMN IF NOT EXISTS venue text,
ADD COLUMN IF NOT EXISTS venue_address text,
ADD COLUMN IF NOT EXISTS hotel_name text,
ADD COLUMN IF NOT EXISTS hotel_address text,
ADD COLUMN IF NOT EXISTS hotel_website text,
ADD COLUMN IF NOT EXISTS hotel_notes text,
ADD COLUMN IF NOT EXISTS hotel_room_block text,
ADD COLUMN IF NOT EXISTS hotel_deadline timestamptz;

-- Add comment to document the columns
COMMENT ON COLUMN couples.venue IS 'Name of the wedding venue';
COMMENT ON COLUMN couples.venue_address IS 'Address of the wedding venue';
COMMENT ON COLUMN couples.hotel_name IS 'Name of the hotel for guest accommodations';
COMMENT ON COLUMN couples.hotel_address IS 'Address of the hotel';
COMMENT ON COLUMN couples.hotel_website IS 'Website URL for hotel bookings';
COMMENT ON COLUMN couples.hotel_notes IS 'Additional notes about hotel accommodations';
COMMENT ON COLUMN couples.hotel_room_block IS 'Room block code or group name';
COMMENT ON COLUMN couples.hotel_deadline IS 'Deadline for room block reservations';