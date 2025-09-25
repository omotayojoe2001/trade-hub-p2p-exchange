-- Fix vendor roles and profiles

-- Get the real user ID for ikeja (replace with actual ID from Authentication panel)
-- UPDATE vendor_profiles SET user_id = 'REAL_IKEJA_USER_ID' WHERE email = 'ikeja@tradehub.com';

-- Create/update profiles with vendor role for all vendor emails
INSERT INTO profiles (user_id, display_name, role, profile_completed) 
SELECT 
    (SELECT id FROM auth.users WHERE email = 'ikeja@tradehub.com'),
    'Ikeja Cash Agent',
    'vendor',
    true
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'ikeja@tradehub.com')
ON CONFLICT (user_id) DO UPDATE SET
    role = 'vendor',
    display_name = 'Ikeja Cash Agent',
    profile_completed = true;

INSERT INTO profiles (user_id, display_name, role, profile_completed) 
SELECT 
    (SELECT id FROM auth.users WHERE email = 'island@tradehub.com'),
    'Island Cash Agent',
    'vendor',
    true
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'island@tradehub.com')
ON CONFLICT (user_id) DO UPDATE SET
    role = 'vendor',
    display_name = 'Island Cash Agent',
    profile_completed = true;

INSERT INTO profiles (user_id, display_name, role, profile_completed) 
SELECT 
    (SELECT id FROM auth.users WHERE email = 'lekki@tradehub.com'),
    'Lekki Cash Agent',
    'vendor',
    true
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'lekki@tradehub.com')
ON CONFLICT (user_id) DO UPDATE SET
    role = 'vendor',
    display_name = 'Lekki Cash Agent',
    profile_completed = true;

-- Update vendor_profiles with real user IDs
UPDATE vendor_profiles 
SET user_id = (SELECT id FROM auth.users WHERE email = 'ikeja@tradehub.com')
WHERE email = 'ikeja@tradehub.com' 
AND EXISTS (SELECT 1 FROM auth.users WHERE email = 'ikeja@tradehub.com');

UPDATE vendor_profiles 
SET user_id = (SELECT id FROM auth.users WHERE email = 'island@tradehub.com')
WHERE email = 'island@tradehub.com'
AND EXISTS (SELECT 1 FROM auth.users WHERE email = 'island@tradehub.com');

UPDATE vendor_profiles 
SET user_id = (SELECT id FROM auth.users WHERE email = 'lekki@tradehub.com')
WHERE email = 'lekki@tradehub.com'
AND EXISTS (SELECT 1 FROM auth.users WHERE email = 'lekki@tradehub.com');

-- Create vendors table if needed
CREATE TABLE IF NOT EXISTS vendors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    location TEXT NOT NULL,
    phone_number TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert vendors table records
INSERT INTO vendors (user_id, name, email, location, phone_number)
SELECT 
    (SELECT id FROM auth.users WHERE email = 'ikeja@tradehub.com'),
    'Ikeja Cash Services',
    'ikeja@tradehub.com',
    'Mainland',
    '+234 803 111 1111'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'ikeja@tradehub.com')
ON CONFLICT (email) DO UPDATE SET
    user_id = (SELECT id FROM auth.users WHERE email = 'ikeja@tradehub.com');

-- Show results
SELECT 'SUCCESS: Vendor roles configured' as status;