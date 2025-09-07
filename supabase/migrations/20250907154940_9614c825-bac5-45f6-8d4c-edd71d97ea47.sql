-- Drop existing conflicting storage policies
DROP POLICY IF EXISTS "Users can update their own files in profiles bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files in profiles bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload files to profiles bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public access to payment proof files" ON storage.objects;

-- Create new comprehensive storage policies for payment proof uploads
CREATE POLICY "Authenticated users can upload to profiles bucket" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profiles' AND 
  auth.role() = 'authenticated'
);

-- Allow users to view their own uploaded files
CREATE POLICY "Users can view their own files in profiles bucket" ON storage.objects
FOR SELECT USING (
  bucket_id = 'profiles' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to payment proof images (needed for vendor verification)
CREATE POLICY "Public access to payment proof files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'profiles' AND
  name LIKE '%payment-proof-%'
);

-- Allow users to update their own files
CREATE POLICY "Users can update their own files in profiles bucket" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profiles' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);