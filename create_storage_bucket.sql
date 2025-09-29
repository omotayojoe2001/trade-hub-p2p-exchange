-- Create storage bucket for message files
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-files', 'message-files', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies (allow all authenticated users for simplicity)
CREATE POLICY "Authenticated users can upload message files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'message-files' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can view message files" ON storage.objects
  FOR SELECT USING (bucket_id = 'message-files');

CREATE POLICY "Authenticated users can delete message files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'message-files' AND
    auth.role() = 'authenticated'
  );