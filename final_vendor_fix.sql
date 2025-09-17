-- FINAL VENDOR FIX - ONE SIMPLE SCRIPT
-- Just run this once and it will work

-- 1. Add role column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT;

-- 2. Delete all existing profiles for vendor emails to start fresh
DELETE FROM profiles WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('ikeja@tradehub.com', 'island@tradehub.com', 'lekki@tradehub.com')
);

-- 3. Insert fresh vendor profiles with role = 'vendor'
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
WHERE u.email IN ('ikeja@tradehub.com', 'island@tradehub.com', 'lekki@tradehub.com');

-- 4. Verify - should show 3 vendors with role = 'vendor'
SELECT u.email, p.role FROM auth.users u 
JOIN profiles p ON u.id = p.user_id 
WHERE u.email IN ('ikeja@tradehub.com', 'island@tradehub.com', 'lekki@tradehub.com');