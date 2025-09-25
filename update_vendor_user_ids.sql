-- STEP 7: Update vendor_profiles with real User IDs
-- Replace these placeholder UUIDs with real ones from Supabase Authentication → Users

-- UPDATE IKEJA VENDOR
UPDATE vendor_profiles 
SET user_id = 'REPLACE_WITH_IKEJA_REAL_USER_ID'
WHERE email = 'ikeja@tradehub.com';

-- UPDATE ISLAND VENDOR  
UPDATE vendor_profiles 
SET user_id = 'REPLACE_WITH_ISLAND_REAL_USER_ID'
WHERE email = 'island@tradehub.com';

-- UPDATE LEKKI VENDOR
UPDATE vendor_profiles 
SET user_id = 'REPLACE_WITH_LEKKI_REAL_USER_ID'
WHERE email = 'lekki@tradehub.com';

-- STEP 8: Create profiles with vendor role
INSERT INTO profiles (user_id, display_name, role, profile_completed) VALUES
('REPLACE_WITH_IKEJA_REAL_USER_ID', 'Ikeja Cash Agent', 'vendor', true),
('REPLACE_WITH_ISLAND_REAL_USER_ID', 'Island Cash Agent', 'vendor', true),
('REPLACE_WITH_LEKKI_REAL_USER_ID', 'Lekki Cash Agent', 'vendor', true)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'vendor',
  profile_completed = true;

-- STEP 9: Create vendors table records
INSERT INTO vendors (user_id, name, location, phone_number, email, is_active) VALUES
('REPLACE_WITH_IKEJA_REAL_USER_ID', 'Ikeja Cash Services', 'Mainland', '+234 803 111 1111', 'ikeja@tradehub.com', true),
('REPLACE_WITH_ISLAND_REAL_USER_ID', 'Island Cash Services', 'Island', '+234 803 222 2222', 'island@tradehub.com', true),
('REPLACE_WITH_LEKKI_REAL_USER_ID', 'Lekki Cash Services', 'Island', '+234 803 333 3333', 'lekki@tradehub.com', true)
ON CONFLICT (email) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  is_active = true;

-- STEP 10: Verify setup
SELECT 'VERIFICATION:' as check_type, 
       vp.email, 
       vp.display_name, 
       vp.bank_name, 
       vp.account_number,
       CASE 
         WHEN vp.user_id::text LIKE '00000000%' THEN 'NEEDS REAL USER_ID' 
         ELSE 'USER_ID UPDATED' 
       END as status
FROM vendor_profiles vp
WHERE vp.email LIKE '%@tradehub.com'
ORDER BY vp.email;