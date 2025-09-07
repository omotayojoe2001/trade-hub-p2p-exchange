-- Fix storage policies for payment proof uploads
-- First ensure the profiles bucket exists with correct settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profiles', 'profiles', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

-- Drop existing storage policies for profiles bucket
DROP POLICY IF EXISTS "profiles_bucket_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "profiles_bucket_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "profiles_bucket_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "profiles_bucket_delete_policy" ON storage.objects;

-- Create proper storage policies for authenticated users
CREATE POLICY "Users can upload to profiles bucket"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profiles'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view files in profiles bucket"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'profiles'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own files in profiles bucket"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profiles'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own files in profiles bucket"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profiles'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);