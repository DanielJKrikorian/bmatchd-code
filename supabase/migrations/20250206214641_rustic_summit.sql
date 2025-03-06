-- Add videos column to vendors table
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS videos text[] DEFAULT '{}';

-- Create storage bucket for vendor videos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-videos', 'vendor-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for vendor videos
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vendor-videos');

CREATE POLICY "Vendor Upload Access"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'vendor-videos' AND
    (auth.uid() = (storage.foldername(name))[1]::uuid OR
     EXISTS (
       SELECT 1 FROM auth.users
       WHERE id = auth.uid()
       AND raw_user_meta_data->>'role' = 'admin'
     ))
  );

CREATE POLICY "Vendor Delete Access"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'vendor-videos' AND
    (auth.uid() = (storage.foldername(name))[1]::uuid OR
     EXISTS (
       SELECT 1 FROM auth.users
       WHERE id = auth.uid()
       AND raw_user_meta_data->>'role' = 'admin'
     ))
  );