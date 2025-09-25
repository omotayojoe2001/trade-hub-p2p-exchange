-- STEP 1: After creating auth users, replace these UUIDs with real ones from Supabase Auth
-- IKEJA_USER_ID = UUID from ikeja@tradehub.com
-- ISLAND_USER_ID = UUID from island@tradehub.com  
-- LEKKI_USER_ID = UUID from lekki@tradehub.com

-- STEP 2: Create profiles with vendor role
INSERT INTO profiles (user_id, display_name, role, profile_completed) VALUES
('REPLACE_WITH_IKEJA_USER_ID', 'Ikeja Cash Agent', 'vendor', true),
('REPLACE_WITH_ISLAND_USER_ID', 'Island Cash Agent', 'vendor', true),
('REPLACE_WITH_LEKKI_USER_ID', 'Lekki Cash Agent', 'vendor', true);

-- STEP 3: Create vendor records
INSERT INTO vendors (user_id, name, location, phone_number, is_active) VALUES
('REPLACE_WITH_IKEJA_USER_ID', 'Ikeja Cash Services', 'Mainland', '+234 803 111 1111', true),
('REPLACE_WITH_ISLAND_USER_ID', 'Island Cash Services', 'Island', '+234 803 222 2222', true),
('REPLACE_WITH_LEKKI_USER_ID', 'Lekki Cash Services', 'Island', '+234 803 333 3333', true);

-- STEP 4: Create vendor_profiles with bank details
INSERT INTO vendor_profiles (user_id, display_name, phone_number, location, address, bank_name, account_number, account_name) VALUES
('REPLACE_WITH_IKEJA_USER_ID', 'Ikeja Cash Agent', '+234 803 111 1111', 'Mainland', 'Ikeja, Lagos', 'GTBank', '0123456789', 'Ikeja Cash Services'),
('REPLACE_WITH_ISLAND_USER_ID', 'Island Cash Agent', '+234 803 222 2222', 'Island', 'Victoria Island, Lagos', 'Access Bank', '0987654321', 'Island Cash Services'),
('REPLACE_WITH_LEKKI_USER_ID', 'Lekki Cash Agent', '+234 803 333 3333', 'Island', 'Lekki Phase 1, Lagos', 'Zenith Bank', '0555666777', 'Lekki Cash Services');