-- FIX DUPLICATE PROFILES AND VENDOR ROLE ISSUES
-- This fixes "JSON object requested, multiple (or no) rows returned" error

-- 1. Remove duplicate profiles (keep the most recent one)
DELETE FROM profiles 
WHERE user_id IN (
  SELECT user_id 
  FROM profiles 
  GROUP BY user_id 
  HAVING COUNT(*) > 1
) 
AND id NOT IN (
  SELECT MAX(id) 
  FROM profiles 
  GROUP BY user_id 
  HAVING COUNT(*) > 1
);

-- 2. Add role column if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT;

-- 3. Create profiles for vendor users if they don't exist
INSERT INTO profiles (user_id, display_name, role, user_type, is_vendor)
SELECT 
  u.id,
  'Vendor User',
  'vendor',
  'vendor',
  true
FROM auth.users u
WHERE u.email IN ('ikeja@tradehub.com', 'island@tradehub.com', 'lekki@tradehub.com')
AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = u.id);

-- 4. Update existing profiles to have vendor role
UPDATE profiles 
SET role = 'vendor', user_type = 'vendor', is_vendor = true
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('ikeja@tradehub.com', 'island@tradehub.com', 'lekki@tradehub.com')
);

-- 5. Verify fix - should show exactly one row per vendor
SELECT 
  u.email,
  p.role,
  p.user_type,
  p.is_vendor,
  COUNT(*) as profile_count
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.email IN ('ikeja@tradehub.com', 'island@tradehub.com', 'lekki@tradehub.com')
GROUP BY u.email, p.role, p.user_type, p.is_vendor;