-- Fix storage policies for payment proof uploads using correct PostgreSQL syntax

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow payment proof uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow payment proof viewing" ON storage.objects;

-- Allow authenticated users to upload files to profiles bucket
CREATE POLICY "Allow payment proof uploads" ON storage.objects
  FOR INSERT 
  TO authenticated
  WITH CHECK (bucket_id = 'profiles');

-- Allow authenticated users to view files in profiles bucket  
CREATE POLICY "Allow payment proof viewing" ON storage.objects
  FOR SELECT 
  TO authenticated
  USING (bucket_id = 'profiles');