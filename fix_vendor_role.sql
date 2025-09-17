-- SIMPLE VENDOR ROLE FIX
-- This fixes the "vendor role required, access denied" error

-- 1. Add role column if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT;

-- 2. Set role = 'vendor' for all vendor users
UPDATE profiles 
SET role = 'vendor' 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('ikeja@tradehub.com', 'island@tradehub.com', 'lekki@tradehub.com')
);

-- 3. Also set user_type = 'vendor' for consistency
UPDATE profiles 
SET user_type = 'vendor' 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('ikeja@tradehub.com', 'island@tradehub.com', 'lekki@tradehub.com')
);

-- 4. Verify the fix
SELECT 
  u.email,
  p.role,
  p.user_type,
  p.display_name
FROM auth.users u
JOIN profiles p ON u.id = p.user_id
WHERE u.email IN ('ikeja@tradehub.com', 'island@tradehub.com', 'lekki@tradehub.com');