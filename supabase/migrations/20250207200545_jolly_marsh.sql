-- Create storage bucket for couple images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('couple-images', 'couple-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Couple Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Couple Delete Access" ON storage.objects;

-- Create policy for public read access
CREATE POLICY "enable_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'couple-images');

-- Create policy for couple upload access
CREATE POLICY "enable_couple_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'couple-images' AND
    (auth.uid() = (storage.foldername(name))[1]::uuid OR
     EXISTS (
       SELECT 1 FROM auth.users
       WHERE id = auth.uid()
       AND raw_user_meta_data->>'role' = 'admin'
     ))
  );

-- Create policy for couple update access
CREATE POLICY "enable_couple_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'couple-images' AND
    (auth.uid() = (storage.foldername(name))[1]::uuid OR
     EXISTS (
       SELECT 1 FROM auth.users
       WHERE id = auth.uid()
       AND raw_user_meta_data->>'role' = 'admin'
     ))
  );

-- Create policy for couple delete access
CREATE POLICY "enable_couple_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'couple-images' AND
    (auth.uid() = (storage.foldername(name))[1]::uuid OR
     EXISTS (
       SELECT 1 FROM auth.users
       WHERE id = auth.uid()
       AND raw_user_meta_data->>'role' = 'admin'
     ))
  );

-- Add comment to document the changes
COMMENT ON TABLE storage.objects IS 'Storage objects with proper couple access policies';