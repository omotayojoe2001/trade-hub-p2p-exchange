-- Drop existing conflicting policies first
DROP POLICY IF EXISTS "Users can upload to profiles bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own profile files" ON storage.objects;

-- Ensure receipts bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for receipts bucket
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

-- Allow users to upload to profiles bucket (fix existing functionality)
CREATE POLICY "Users can upload profiles files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profiles' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view profiles files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'profiles' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);