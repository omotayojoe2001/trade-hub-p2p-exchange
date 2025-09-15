-- Update existing profiles to be vendors and create vendor entries

-- Drop constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;

-- Update existing profiles to be vendors
UPDATE profiles SET 
    display_name = 'Ikeja Vendor Agent',
    phone_number = '+234 801 234 5678',
    location = 'Ikeja, Lagos',
    bio = 'Cash delivery agent for Ikeja area',
    user_type = 'vendor',
    is_vendor = true
WHERE user_id = '053d8388-9fed-4827-8e7e-9cd6bb77e95c';

UPDATE profiles SET 
    display_name = 'Island Vendor Agent',
    phone_number = '+234 801 234 5679',
    location = 'Lagos Island',
    bio = 'Cash delivery agent for Island area',
    user_type = 'vendor',
    is_vendor = true
WHERE user_id = '4233b8b1-5bc4-4373-a599-69930ab79863';

UPDATE profiles SET 
    display_name = 'Lekki Vendor Agent',
    phone_number = '+234 801 234 5680',
    location = 'Lekki, Lagos',
    bio = 'Cash delivery agent for Lekki area',
    user_type = 'vendor',
    is_vendor = true
WHERE user_id = 'ce474c61-0d72-4d99-9068-cd508421e6ad';

-- Create vendor entries (use INSERT ... ON CONFLICT to avoid duplicates)
INSERT INTO vendors (user_id, name, location, phone_number, bank_name, account_number, account_name, is_active)
VALUES ('053d8388-9fed-4827-8e7e-9cd6bb77e95c', 'Ikeja Agent', 'Ikeja', '+234 801 234 5678', 'Central Exchange Bank', '1234567890', 'TradeHub Vendor Services', true)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO vendors (user_id, name, location, phone_number, bank_name, account_number, account_name, is_active)
VALUES ('4233b8b1-5bc4-4373-a599-69930ab79863', 'Island Agent', 'Lagos Island', '+234 801 234 5679', 'Central Exchange Bank', '1234567891', 'TradeHub Vendor Services', true)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO vendors (user_id, name, location, phone_number, bank_name, account_number, account_name, is_active)
VALUES ('ce474c61-0d72-4d99-9068-cd508421e6ad', 'Lekki Agent', 'Lekki', '+234 801 234 5680', 'Central Exchange Bank', '1234567892', 'TradeHub Vendor Services', true)
ON CONFLICT (user_id) DO NOTHING;