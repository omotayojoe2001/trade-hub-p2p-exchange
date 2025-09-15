-- Setup 3 vendors at once
-- Replace USER_ID_1, USER_ID_2, USER_ID_3 with actual UUIDs from Supabase Auth

-- Vendor 1 (Ikeja)
INSERT INTO profiles (user_id, display_name, phone_number, location, bio, user_type, is_vendor) 
VALUES ('USER_ID_1', 'Ikeja Vendor Agent', '+234 801 234 5678', 'Ikeja, Lagos', 'Cash delivery agent for Ikeja area', 'vendor', true);

INSERT INTO vendors (user_id, name, location, phone_number, bank_name, account_number, account_name, is_active)
VALUES ('USER_ID_1', 'Ikeja Agent', 'Ikeja', '+234 801 234 5678', 'Central Exchange Bank', '1234567890', 'TradeHub Vendor Services', true);

-- Vendor 2 (Island)
INSERT INTO profiles (user_id, display_name, phone_number, location, bio, user_type, is_vendor) 
VALUES ('USER_ID_2', 'Island Vendor Agent', '+234 801 234 5679', 'Lagos Island', 'Cash delivery agent for Island area', 'vendor', true);

INSERT INTO vendors (user_id, name, location, phone_number, bank_name, account_number, account_name, is_active)
VALUES ('USER_ID_2', 'Island Agent', 'Lagos Island', '+234 801 234 5679', 'Central Exchange Bank', '1234567891', 'TradeHub Vendor Services', true);

-- Vendor 3 (Lekki)
INSERT INTO profiles (user_id, display_name, phone_number, location, bio, user_type, is_vendor) 
VALUES ('USER_ID_3', 'Lekki Vendor Agent', '+234 801 234 5680', 'Lekki, Lagos', 'Cash delivery agent for Lekki area', 'vendor', true);

INSERT INTO vendors (user_id, name, location, phone_number, bank_name, account_number, account_name, is_active)
VALUES ('USER_ID_3', 'Lekki Agent', 'Lekki', '+234 801 234 5680', 'Central Exchange Bank', '1234567892', 'TradeHub Vendor Services', true);