-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category);
CREATE INDEX IF NOT EXISTS idx_vendors_location ON vendors(location);
CREATE INDEX IF NOT EXISTS idx_vendors_rating ON vendors(rating);
CREATE INDEX IF NOT EXISTS idx_vendors_subscription_plan ON vendors(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_couples_location ON couples(location);
CREATE INDEX IF NOT EXISTS idx_couples_wedding_date ON couples(wedding_date);

-- Add indexes for foreign key relationships
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_couples_user_id ON couples(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_reviews_vendor_id ON reviews(vendor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_couple_id ON reviews(couple_id);
CREATE INDEX IF NOT EXISTS idx_appointments_vendor_id ON appointments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_couple_id ON appointments(couple_id);