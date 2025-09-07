-- Ensure storage bucket exists and policies are correct for receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Update existing bucket to allow receipts if it exists
UPDATE storage.buckets 
SET public = false 
WHERE id = 'profiles';

-- Drop existing policies for receipts bucket
DROP POLICY IF EXISTS "Users can upload payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own payment receipts" ON storage.objects;

-- Create comprehensive storage policies for payment receipts
CREATE POLICY "Users can upload payment receipts" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'receipts' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own payment receipts" ON storage.objects
FOR SELECT USING (
  bucket_id = 'receipts' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to upload to profiles bucket (existing functionality)
CREATE POLICY "Users can upload to profiles bucket" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profiles' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own profile files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'profiles' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);