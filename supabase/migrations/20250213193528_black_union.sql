-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
  v_vendor_id uuid;
BEGIN
  -- Get role from metadata with validation
  v_role := COALESCE(NULLIF(TRIM((NEW.raw_user_meta_data->>'role')::text), ''), 'couple');
  IF v_role NOT IN ('couple', 'vendor', 'admin') THEN
    v_role := 'couple';
  END IF;

  -- Insert into public.users first
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, v_role)
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    role = v_role
  RETURNING id;

  -- Create profile based on role
  IF v_role = 'couple' THEN
    INSERT INTO couples (
      user_id,
      partner1_name,
      partner2_name,
      location
    ) VALUES (
      NEW.id,
      '',
      '',
      ''
    )
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF v_role = 'vendor' THEN
    INSERT INTO vendors (
      user_id,
      business_name,
      category,
      description,
      location,
      price_range,
      rating,
      images,
      email,
      subscription_plan
    ) VALUES (
      NEW.id,
      '',
      '',
      '',
      '',
      'Premium',
      0,
      '{}',
      NEW.email,
      NULL -- Explicitly set subscription_plan to NULL for new vendors
    )
    RETURNING id INTO v_vendor_id;

    -- Create welcome notification for new vendor
    INSERT INTO notifications (
      user_id,
      type,
      title,
      content,
      link,
      sender_name,
      recipient_name
    ) VALUES (
      NEW.id,
      'welcome',
      'Welcome to BMATCHD!',
      'To start receiving leads and connecting with couples, please select a subscription plan.',
      '/subscription',
      'BMATCHD',
      ''
    );
  END IF;

  -- Auto-confirm email
  UPDATE auth.users
  SET 
    email_confirmed_at = now(),
    confirmed_at = now(),
    last_sign_in_at = now(),
    raw_app_meta_data = jsonb_build_object(
      'provider', 'email',
      'providers', array['email']::text[],
      'email_confirmed', true
    )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Drop existing view if it exists
DROP VIEW IF EXISTS message_thread_details;

-- Create improved view for message thread details
CREATE OR REPLACE VIEW message_thread_details AS
WITH thread_participants AS (
  SELECT 
    mt.id as thread_id,
    mt.vendor_id,
    mt.couple_id,
    mt.last_message_at,
    mt.created_at,
    mt.thread_status,
    v.business_name as vendor_name,
    v.category as vendor_category,
    v.user_id as vendor_user_id,
    v.subscription_plan,
    c.partner1_name,
    c.partner2_name,
    c.user_id as couple_user_id
  FROM message_threads mt
  LEFT JOIN vendors v ON v.id = mt.vendor_id
  LEFT JOIN couples c ON c.id = mt.couple_id
)
SELECT 
  thread_id as id,
  vendor_id,
  couple_id,
  last_message_at,
  created_at,
  thread_status,
  COALESCE(vendor_name, '') as vendor_name,
  COALESCE(vendor_category, '') as vendor_category,
  COALESCE(partner1_name, '') as partner1_name,
  COALESCE(partner2_name, '') as partner2_name,
  vendor_user_id,
  couple_user_id,
  COALESCE(subscription_plan, 'none') as subscription_plan,
  (
    SELECT count(*)::int 
    FROM messages m 
    WHERE m.message_thread_id = thread_id
    AND m.status = 'pending'
    AND m.receiver_id = auth.uid()
  ) as unread_count
FROM thread_participants tp
WHERE 
  EXISTS (
    SELECT 1 FROM vendors 
    WHERE id = tp.vendor_id 
    AND user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM couples 
    WHERE id = tp.couple_id 
    AND user_id = auth.uid()
  );

-- Grant necessary permissions
GRANT SELECT ON message_thread_details TO authenticated;

-- Add comment to document the changes
COMMENT ON FUNCTION handle_new_user IS 'Handles new user creation with proper profile initialization';
COMMENT ON VIEW message_thread_details IS 'Message thread details with proper name handling and null safety';