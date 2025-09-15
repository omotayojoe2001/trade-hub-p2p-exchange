-- Fix profiles constraint step by step

-- Step 1: Check what user_type values exist in profiles table
SELECT DISTINCT user_type FROM profiles;

-- Step 2: Update any invalid user_type values to 'user'
UPDATE profiles SET user_type = 'user' WHERE user_type NOT IN ('user', 'merchant', 'admin');

-- Step 3: Drop the old constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;

-- Step 4: Add new constraint that includes 'vendor'
ALTER TABLE profiles 
ADD CONSTRAINT profiles_user_type_check 
CHECK (user_type IN ('user', 'merchant', 'vendor', 'admin'));

-- Step 5: Now create the vendor profiles
INSERT INTO profiles (user_id, display_name, phone_number, location, bio, user_type, is_vendor) 
VALUES ('053d8388-9fed-4827-8e7e-9cd6bb77e95c', 'Ikeja Vendor Agent', '+234 801 234 5678', 'Ikeja, Lagos', 'Cash delivery agent for Ikeja area', 'vendor', true);

INSERT INTO vendors (user_id, name, location, phone_number, bank_name, account_number, account_name, is_active)
VALUES ('053d8388-9fed-4827-8e7e-9cd6bb77e95c', 'Ikeja Agent', 'Ikeja', '+234 801 234 5678', 'Central Exchange Bank', '1234567890', 'TradeHub Vendor Services', true);

INSERT INTO profiles (user_id, display_name, phone_number, location, bio, user_type, is_vendor) 
VALUES ('4233b8b1-5bc4-4373-a599-69930ab79863', 'Island Vendor Agent', '+234 801 234 5679', 'Lagos Island', 'Cash delivery agent for Island area', 'vendor', true);

INSERT INTO vendors (user_id, name, location, phone_number, bank_name, account_number, account_name, is_active)
VALUES ('4233b8b1-5bc4-4373-a599-69930ab79863', 'Island Agent', 'Lagos Island', '+234 801 234 5679', 'Central Exchange Bank', '1234567891', 'TradeHub Vendor Services', true);

INSERT INTO profiles (user_id, display_name, phone_number, location, bio, user_type, is_vendor) 
VALUES ('ce474c61-0d72-4d99-9068-cd508421e6ad', 'Lekki Vendor Agent', '+234 801 234 5680', 'Lekki, Lagos', 'Cash delivery agent for Lekki area', 'vendor', true);

INSERT INTO vendors (user_id, name, location, phone_number, bank_name, account_number, account_name, is_active)
VALUES ('ce474c61-0d72-4d99-9068-cd508421e6ad', 'Lekki Agent', 'Lekki', '+234 801 234 5680', 'Central Exchange Bank', '1234567892', 'TradeHub Vendor Services', true);