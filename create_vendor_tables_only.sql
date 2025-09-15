-- Create vendor-related tables without inserting data
-- You can add vendor profiles later after creating auth users

-- Add vendor columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_vendor BOOLEAN DEFAULT false;

-- Add user_id column to vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create vendor_credentials table for login
CREATE TABLE IF NOT EXISTS vendor_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE vendor_credentials ENABLE ROW LEVEL SECURITY;

-- Policies for vendor_credentials
CREATE POLICY "Vendors can view their own credentials" ON vendor_credentials
  FOR SELECT USING (auth.uid() = user_id);

-- Add indexes
CREATE INDEX idx_vendor_credentials_vendor_id ON vendor_credentials(vendor_id);
CREATE INDEX idx_vendor_credentials_user_id ON vendor_credentials(user_id);