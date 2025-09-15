-- Create a test vendor account directly in Supabase
-- Run this in Supabase SQL Editor

-- Insert test vendor user into auth.users (this may not work due to RLS)
-- Instead, use Supabase Dashboard > Authentication > Users > Add User

-- After creating the user in the dashboard, run this to set up the vendor profile:
-- Replace 'ACTUAL_USER_ID' with the real UUID from the created user

INSERT INTO profiles (user_id, display_name, phone_number, location, bio, user_type, is_vendor) 
VALUES ('ACTUAL_USER_ID', 'Test Vendor Agent', '+234 801 234 5678', 'Lagos', 'Test cash delivery agent', 'vendor', true);

-- Create vendor entry
INSERT INTO vendors (user_id, name, location, phone_number, bank_name, account_number, account_name, is_active)
VALUES ('ACTUAL_USER_ID', 'Test Vendor', 'Lagos', '+234 801 234 5678', 'Test Bank', '1234567890', 'Test Vendor Account', true);