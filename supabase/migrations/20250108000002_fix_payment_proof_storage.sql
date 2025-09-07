-- Fix storage policies for payment proof viewing
-- Allow vendors to view payment proof images uploaded by customers

-- Drop ALL existing policies that might be conflicting
DROP POLICY IF EXISTS "Public access to payment proof files" ON storage.objects;
DROP POLICY IF EXISTS "Allow payment proof viewing" ON storage.objects;
DROP POLICY IF EXISTS "Allow payment proof viewing for vendors" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload files to profiles bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files in profiles bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;

-- Ensure the profiles bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profiles',
  'profiles',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

-- Create comprehensive policies for the profiles bucket

-- 1. Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload to profiles bucket" ON storage.objects
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    bucket_id = 'profiles' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 2. Allow users to view their own files
CREATE POLICY "Users can view their own files" ON storage.objects
  FOR SELECT 
  TO authenticated
  USING (
    bucket_id = 'profiles' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 3. Allow users to update their own files
CREATE POLICY "Users can update their own files" ON storage.objects
  FOR UPDATE 
  TO authenticated
  USING (
    bucket_id = 'profiles' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4. Allow users to delete their own files
CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE 
  TO authenticated
  USING (
    bucket_id = 'profiles' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 5. Allow ALL authenticated users to view payment proof files (for vendors)
CREATE POLICY "Allow payment proof viewing for vendors" ON storage.objects
  FOR SELECT 
  TO authenticated
  USING (
    bucket_id = 'profiles' AND
    name LIKE '%payment-proof-%'
  );

-- 6. Allow public access to payment proof files (fallback)
CREATE POLICY "Public access to payment proof files" ON storage.objects
  FOR SELECT 
  USING (
    bucket_id = 'profiles' AND
    name LIKE '%payment-proof-%'
  );
