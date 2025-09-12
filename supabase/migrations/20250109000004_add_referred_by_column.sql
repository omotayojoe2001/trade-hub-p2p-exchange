-- Add referred_by column to profiles table for referral tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);