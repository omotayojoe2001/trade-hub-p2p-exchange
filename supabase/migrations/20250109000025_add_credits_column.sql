-- Add credits column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;

-- Update existing users to have 0 credits
UPDATE profiles SET credits = 0 WHERE credits IS NULL;