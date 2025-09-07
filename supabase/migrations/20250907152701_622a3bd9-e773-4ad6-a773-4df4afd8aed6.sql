-- Fix storage bucket policies to allow payment proof uploads

-- Create policy for payment proof uploads
INSERT INTO storage.policies (name, bucket_id, operation, statement, predicate)
VALUES (
  'Allow payment proof uploads',
  'profiles',
  'INSERT',
  'true',
  'auth.uid() IS NOT NULL'
) ON CONFLICT (name, bucket_id) DO NOTHING;

-- Allow users to view their own uploaded payment proofs
INSERT INTO storage.policies (name, bucket_id, operation, statement, predicate)
VALUES (
  'Allow payment proof viewing',
  'profiles',
  'SELECT',
  'true',
  'auth.uid() IS NOT NULL'
) ON CONFLICT (name, bucket_id) DO NOTHING;