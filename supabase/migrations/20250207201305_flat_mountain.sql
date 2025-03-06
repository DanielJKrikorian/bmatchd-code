-- Drop all existing storage policies
DO $$ 
BEGIN
  -- Drop policies for vendor-images bucket
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
  DROP POLICY IF EXISTS "Vendor Upload Access" ON storage.objects;
  DROP POLICY IF EXISTS "Vendor Delete Access" ON storage.objects;
  DROP POLICY IF EXISTS "allow_public_read" ON storage.objects;
  DROP POLICY IF EXISTS "allow_user_upload" ON storage.objects;
  DROP POLICY IF EXISTS "allow_user_update" ON storage.objects;
  DROP POLICY IF EXISTS "allow_user_delete" ON storage.objects;
  
  -- Drop policies for couple-images bucket
  DROP POLICY IF EXISTS "enable_public_read" ON storage.objects;
  DROP POLICY IF EXISTS "enable_couple_upload" ON storage.objects;
  DROP POLICY IF EXISTS "enable_couple_update" ON storage.objects;
  DROP POLICY IF EXISTS "enable_couple_delete" ON storage.objects;
END $$;

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('vendor-images', 'vendor-images', true),
  ('couple-images', 'couple-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create unified policies with unique names
CREATE POLICY "storage_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('vendor-images', 'couple-images'));

CREATE POLICY "storage_user_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    (bucket_id = 'vendor-images' AND EXISTS (
      SELECT 1 FROM vendors 
      WHERE user_id = auth.uid()
      AND user_id = (storage.foldername(name))[1]::uuid
    )) OR
    (bucket_id = 'couple-images' AND EXISTS (
      SELECT 1 FROM couples
      WHERE user_id = auth.uid()
      AND user_id = (storage.foldername(name))[1]::uuid
    )) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "storage_user_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    (bucket_id = 'vendor-images' AND EXISTS (
      SELECT 1 FROM vendors 
      WHERE user_id = auth.uid()
      AND user_id = (storage.foldername(name))[1]::uuid
    )) OR
    (bucket_id = 'couple-images' AND EXISTS (
      SELECT 1 FROM couples
      WHERE user_id = auth.uid()
      AND user_id = (storage.foldername(name))[1]::uuid
    )) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "storage_user_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    (bucket_id = 'vendor-images' AND EXISTS (
      SELECT 1 FROM vendors 
      WHERE user_id = auth.uid()
      AND user_id = (storage.foldername(name))[1]::uuid
    )) OR
    (bucket_id = 'couple-images' AND EXISTS (
      SELECT 1 FROM couples
      WHERE user_id = auth.uid()
      AND user_id = (storage.foldername(name))[1]::uuid
    )) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Add comment to document the changes
COMMENT ON TABLE storage.objects IS 'Storage objects with unified access policies for vendors and couples';