-- Create vendor user accounts and profiles for testing
-- Note: You'll need to create these users in Supabase Auth first, then run this script

-- Add vendor columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_vendor BOOLEAN DEFAULT false;

-- Insert vendor profiles (replace with actual user IDs after creating auth accounts)
INSERT INTO profiles (user_id, display_name, phone_number, location, bio, user_type, is_vendor) VALUES
-- Mainland Vendors
('VENDOR_IKEJA_USER_ID', 'TradeHub Ikeja Agent', '+234 801 234 5678', 'Ikeja, Lagos', 'Cash delivery agent for Ikeja area', 'vendor', true),
('VENDOR_YABA_USER_ID', 'TradeHub Yaba Agent', '+234 802 345 6789', 'Yaba, Lagos', 'Cash delivery agent for Yaba area', 'vendor', true),
('VENDOR_AIRPORT_USER_ID', 'TradeHub Airport Agent', '+234 803 456 7890', 'Airport Road, Lagos', 'Cash delivery agent for Airport Road area', 'vendor', true),

-- Island Vendors  
('VENDOR_ISLAND_USER_ID', 'TradeHub Island Agent', '+234 804 567 8901', 'Lagos Island', 'Cash delivery agent for Lagos Island area', 'vendor', true),
('VENDOR_LEKKI_USER_ID', 'TradeHub Lekki Agent', '+234 805 678 9012', 'Lekki, Lagos', 'Cash delivery agent for Lekki area', 'vendor', true),
('VENDOR_AJAH_USER_ID', 'TradeHub Ajah Agent', '+234 806 789 0123', 'Ajah, Lagos', 'Cash delivery agent for Ajah area', 'vendor', true);

-- Update vendors table to link with user profiles
UPDATE vendors SET user_id = 'VENDOR_IKEJA_USER_ID' WHERE location = 'Ikeja';
UPDATE vendors SET user_id = 'VENDOR_YABA_USER_ID' WHERE location = 'Yaba';
UPDATE vendors SET user_id = 'VENDOR_AIRPORT_USER_ID' WHERE location = 'Airport Road';
UPDATE vendors SET user_id = 'VENDOR_ISLAND_USER_ID' WHERE location = 'Lagos Island';
UPDATE vendors SET user_id = 'VENDOR_LEKKI_USER_ID' WHERE location = 'Lekki';
UPDATE vendors SET user_id = 'VENDOR_AJAH_USER_ID' WHERE location = 'Ajah';

-- Add user_id column to vendors table if it doesn't exist
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

-- Insert vendor credentials
INSERT INTO vendor_credentials (vendor_id, user_id, username) VALUES
((SELECT id FROM vendors WHERE location = 'Ikeja'), 'VENDOR_IKEJA_USER_ID', 'ikeja_agent'),
((SELECT id FROM vendors WHERE location = 'Yaba'), 'VENDOR_YABA_USER_ID', 'yaba_agent'),
((SELECT id FROM vendors WHERE location = 'Airport Road'), 'VENDOR_AIRPORT_USER_ID', 'airport_agent'),
((SELECT id FROM vendors WHERE location = 'Lagos Island'), 'VENDOR_ISLAND_USER_ID', 'island_agent'),
((SELECT id FROM vendors WHERE location = 'Lekki'), 'VENDOR_LEKKI_USER_ID', 'lekki_agent'),
((SELECT id FROM vendors WHERE location = 'Ajah'), 'VENDOR_AJAH_USER_ID', 'ajah_agent');

-- Enable RLS
ALTER TABLE vendor_credentials ENABLE ROW LEVEL SECURITY;

-- Policies for vendor_credentials
CREATE POLICY "Vendors can view their own credentials" ON vendor_credentials
  FOR SELECT USING (auth.uid() = user_id);

-- Add indexes
CREATE INDEX idx_vendor_credentials_vendor_id ON vendor_credentials(vendor_id);
CREATE INDEX idx_vendor_credentials_user_id ON vendor_credentials(user_id);