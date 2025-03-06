-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;

-- Create policy with unique name
CREATE POLICY "enable_notification_access"
  ON notifications
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Add comment to document the change
COMMENT ON TABLE notifications IS 'System notifications for users';