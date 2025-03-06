-- Drop existing storage policies
DO $$
BEGIN
  -- Drop policies if they exist
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
  DROP POLICY IF EXISTS "Vendor Upload Access" ON storage.objects;
  DROP POLICY IF EXISTS "Vendor Delete Access" ON storage.objects;
  DROP POLICY IF EXISTS "enable_public_read" ON storage.objects;
  DROP POLICY IF EXISTS "enable_vendor_upload" ON storage.objects;
  DROP POLICY IF EXISTS "enable_vendor_update" ON storage.objects;
  DROP POLICY IF EXISTS "enable_vendor_delete" ON storage.objects;
  
  -- Create storage bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('vendor-images', 'vendor-images', true)
  ON CONFLICT (id) DO NOTHING;

  -- Create policy for public read access
  CREATE POLICY "allow_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'vendor-images');

  -- Create policy for vendor upload access
  CREATE POLICY "allow_vendor_upload"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'vendor-images');

  -- Create policy for vendor update access
  CREATE POLICY "allow_vendor_update"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'vendor-images');

  -- Create policy for vendor delete access
  CREATE POLICY "allow_vendor_delete"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'vendor-images');

END $$;

-- Add comment to document the changes
COMMENT ON TABLE storage.objects IS 'Storage objects with simplified access policies';