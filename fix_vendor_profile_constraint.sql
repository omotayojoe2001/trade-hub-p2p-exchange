-- Fix profiles table to allow vendor user_type

-- First, check what user_type values are allowed
-- SELECT constraint_name, check_clause FROM information_schema.check_constraints WHERE table_name = 'profiles';

-- Drop the existing check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;

-- Add new constraint that includes 'vendor'
ALTER TABLE profiles 
ADD CONSTRAINT profiles_user_type_check 
CHECK (user_type IN ('user', 'merchant', 'vendor', 'admin'));

-- Now create the vendor profile (replace with your actual UUID)
INSERT INTO profiles (user_id, display_name, phone_number, location, bio, user_type, is_vendor) 
VALUES ('053d8388-9fed-4827-8e7e-9cd6bb77e95c', 'Ikeja Vendor Agent', '+234 801 234 5678', 'Ikeja, Lagos', 'Cash delivery agent for Ikeja area', 'vendor', true);

-- Create vendor entry
INSERT INTO vendors (user_id, name, location, phone_number, bank_name, account_number, account_name, is_active)
VALUES ('053d8388-9fed-4827-8e7e-9cd6bb77e95c', 'Ikeja Agent', 'Ikeja', '+234 801 234 5678', 'Central Exchange Bank', '1234567890', 'TradeHub Vendor Services', true);