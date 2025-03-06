/*
  # Add Storage Bucket for Vendor Images

  1. New Storage Bucket
    - Create 'vendor-images' bucket for storing vendor profile and gallery images
  2. Security
    - Enable public access for reading images
    - Restrict uploads to authenticated vendors only
*/

-- Create storage bucket for vendor images
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-images', 'vendor-images', true);

-- Allow public access to read images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'vendor-images');

-- Allow authenticated vendors to upload images
CREATE POLICY "Vendor Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow vendors to delete their own images
CREATE POLICY "Vendor Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vendor-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);