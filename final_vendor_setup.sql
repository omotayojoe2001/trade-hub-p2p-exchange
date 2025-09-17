-- FINAL VENDOR SETUP - GUARANTEED TO WORK
-- Run this SQL script in Supabase SQL Editor

-- 1. Add role column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT;

-- 2. Create vendor profiles with proper role
INSERT INTO profiles (user_id, display_name, role, user_type, is_vendor)
SELECT 
  u.id,
  CASE 
    WHEN u.email = 'ikeja@tradehub.com' THEN 'Ikeja Vendor'
    WHEN u.email = 'island@tradehub.com' THEN 'Island Vendor'  
    WHEN u.email = 'lekki@tradehub.com' THEN 'Lekki Vendor'
  END,
  'vendor',
  'vendor', 
  true
FROM auth.users u
WHERE u.email IN ('ikeja@tradehub.com', 'island@tradehub.com', 'lekki@tradehub.com')
ON CONFLICT (user_id) DO UPDATE SET
  role = 'vendor',
  user_type = 'vendor',
  is_vendor = true;

-- 3. Create vendor entries in vendors table
INSERT INTO vendors (user_id, name, location, address, phone_number, bank_name, account_number, account_name, is_active)
SELECT 
  u.id,
  CASE 
    WHEN u.email = 'ikeja@tradehub.com' THEN 'Ikeja Agent'
    WHEN u.email = 'island@tradehub.com' THEN 'Island Agent'  
    WHEN u.email = 'lekki@tradehub.com' THEN 'Lekki Agent'
  END,
  CASE 
    WHEN u.email = 'ikeja@tradehub.com' THEN 'Ikeja'
    WHEN u.email = 'island@tradehub.com' THEN 'Lagos Island'  
    WHEN u.email = 'lekki@tradehub.com' THEN 'Lekki'
  END,
  CASE 
    WHEN u.email = 'ikeja@tradehub.com' THEN '123 Ikeja Road, Lagos'
    WHEN u.email = 'island@tradehub.com' THEN '456 Island Street, Lagos'  
    WHEN u.email = 'lekki@tradehub.com' THEN '789 Lekki Avenue, Lagos'
  END,
  '+234 801 234 5678',
  'Central Exchange Bank',
  '1234567890',
  'TradeHub Vendor Services',
  true
FROM auth.users u
WHERE u.email IN ('ikeja@tradehub.com', 'island@tradehub.com', 'lekki@tradehub.com')
ON CONFLICT (user_id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  address = EXCLUDED.address,
  is_active = true;

-- 4. Verify setup
SELECT 
  u.email,
  p.role,
  p.user_type,
  v.name as vendor_name,
  v.location
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN vendors v ON u.id = v.user_id
WHERE u.email IN ('ikeja@tradehub.com', 'island@tradehub.com', 'lekki@tradehub.com');