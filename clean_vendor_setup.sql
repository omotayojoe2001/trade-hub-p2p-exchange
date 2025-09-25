-- STEP 1: Create vendor_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS vendor_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    phone_number TEXT,
    location TEXT NOT NULL, -- 'Mainland' or 'Island'
    address TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 2: Clean existing vendor data (if any)
-- Skip cleaning if tables don't exist or have different schemas
DO $$
BEGIN
    -- Clean vendor_profiles if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'vendor_profiles') THEN
        DELETE FROM vendor_profiles WHERE email LIKE '%@tradehub.com';
    END IF;
    
    -- Clean vendors table (check if email column exists)
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'email') THEN
        DELETE FROM vendors WHERE email LIKE '%@tradehub.com';
    ELSE
        -- If no email column, delete all vendors (safer for clean setup)
        DELETE FROM vendors;
    END IF;
    
    -- Clean profiles
    DELETE FROM profiles WHERE user_id IN (
        SELECT id FROM auth.users WHERE email LIKE '%@tradehub.com'
    );
END $$;

-- STEP 3: Enable RLS on vendor_profiles
ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create RLS policies
DROP POLICY IF EXISTS "Vendors can view their own profile" ON vendor_profiles;
DROP POLICY IF EXISTS "Anyone can view active vendors" ON vendor_profiles;
DROP POLICY IF EXISTS "Vendors can update their own profile" ON vendor_profiles;

CREATE POLICY "Vendors can view their own profile" ON vendor_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active vendors" ON vendor_profiles
    FOR SELECT USING (is_active = true);

CREATE POLICY "Vendors can update their own profile" ON vendor_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- STEP 5: Clean vendors table and recreate if needed
CREATE TABLE IF NOT EXISTS vendors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    location TEXT NOT NULL,
    phone_number TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 6: Insert placeholder vendor data (will be updated with real user_ids later)
INSERT INTO vendor_profiles (user_id, email, display_name, phone_number, location, address, bank_name, account_number, account_name) VALUES
('00000000-0000-0000-0000-000000000001', 'ikeja@tradehub.com', 'Ikeja Cash Agent', '+234 803 111 1111', 'Mainland', 'Ikeja, Lagos', 'GTBank', '0123456789', 'Ikeja Cash Services'),
('00000000-0000-0000-0000-000000000002', 'island@tradehub.com', 'Island Cash Agent', '+234 803 222 2222', 'Island', 'Victoria Island, Lagos', 'Access Bank', '0987654321', 'Island Cash Services'),
('00000000-0000-0000-0000-000000000003', 'lekki@tradehub.com', 'Lekki Cash Agent', '+234 803 333 3333', 'Island', 'Lekki Phase 1, Lagos', 'Zenith Bank', '0555666777', 'Lekki Cash Services');

-- STEP 7: Show what needs to be done next
SELECT 'NEXT STEPS:' as instruction, 
       'Go to Supabase Auth → Users and manually create these 3 users:' as step1,
       'ikeja@tradehub.com / TradeHub2024!' as user1,
       'island@tradehub.com / TradeHub2024!' as user2,
       'lekki@tradehub.com / TradeHub2024!' as user3,
       'Then run update_vendor_user_ids.sql with the real User IDs' as step2;