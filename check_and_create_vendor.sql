-- CHECK PROFILES TABLE STRUCTURE AND CREATE VENDOR
-- This script first checks what columns exist, then creates the vendor accordingly

-- Step 1: Check what columns exist in profiles table
SELECT 
    'Profiles Table Columns' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Step 2: Check if user_role enum exists
SELECT 
    'User Role Enum Values' as info,
    enumlabel as role_value
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'user_role';

-- Step 3: Create test vendor (safe version)
DO $$
DECLARE
    test_user_id UUID;
    test_email TEXT := 'testvendor@tradehub.com';
    test_name TEXT := 'Test Vendor';
    test_phone TEXT := '+2348012345678';
    test_bank_account TEXT := '1234567890';
    test_bank_name TEXT := 'First Bank';
    test_bank_code TEXT := '011';
    has_role_column BOOLEAN := false;
    has_credits_column BOOLEAN := false;
    has_is_merchant_column BOOLEAN := false;
BEGIN
    -- Check if user exists
    SELECT id INTO test_user_id 
    FROM auth.users 
    WHERE email = test_email;
    
    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found. Please create this user first in Supabase Auth Dashboard.', test_email;
    END IF;
    
    -- Check which columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'role'
    ) INTO has_role_column;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'credits_balance'
    ) INTO has_credits_column;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'is_merchant'
    ) INTO has_is_merchant_column;
    
    RAISE NOTICE 'Column check: role=%, credits_balance=%, is_merchant=%', 
        has_role_column, has_credits_column, has_is_merchant_column;
    
    -- Create profile with only existing columns
    IF has_role_column AND has_credits_column AND has_is_merchant_column THEN
        -- Full profile with all columns
        INSERT INTO public.profiles (
            user_id, 
            display_name, 
            phone_number, 
            role,
            is_merchant,
            credits_balance,
            created_at
        ) VALUES (
            test_user_id,
            test_name,
            test_phone,
            'vendor'::user_role,
            true,
            0,
            now()
        )
        ON CONFLICT (user_id) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            phone_number = EXCLUDED.phone_number,
            role = EXCLUDED.role,
            is_merchant = EXCLUDED.is_merchant,
            credits_balance = EXCLUDED.credits_balance;
            
    ELSIF has_role_column AND has_is_merchant_column THEN
        -- Profile without credits_balance
        INSERT INTO public.profiles (
            user_id, 
            display_name, 
            phone_number, 
            role,
            is_merchant,
            created_at
        ) VALUES (
            test_user_id,
            test_name,
            test_phone,
            'vendor'::user_role,
            true,
            now()
        )
        ON CONFLICT (user_id) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            phone_number = EXCLUDED.phone_number,
            role = EXCLUDED.role,
            is_merchant = EXCLUDED.is_merchant;
            
    ELSE
        -- Basic profile (fallback)
        INSERT INTO public.profiles (
            user_id, 
            display_name, 
            phone_number,
            created_at
        ) VALUES (
            test_user_id,
            test_name,
            test_phone,
            now()
        )
        ON CONFLICT (user_id) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            phone_number = EXCLUDED.phone_number;
            
        RAISE NOTICE 'WARNING: Created basic profile only. Role and merchant columns may not exist.';
    END IF;
    
    -- Create vendor profile (this should work if vendors table exists)
    BEGIN
        INSERT INTO public.vendors (
            user_id,
            display_name,
            phone,
            bank_account,
            bank_name,
            bank_code,
            active
        ) VALUES (
            test_user_id,
            test_name,
            test_phone,
            test_bank_account,
            test_bank_name,
            test_bank_code,
            true
        )
        ON CONFLICT (user_id) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            phone = EXCLUDED.phone,
            bank_account = EXCLUDED.bank_account,
            bank_name = EXCLUDED.bank_name,
            bank_code = EXCLUDED.bank_code,
            active = EXCLUDED.active;
            
        RAISE NOTICE '✅ VENDOR CREATED SUCCESSFULLY!';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR creating vendor profile: %', SQLERRM;
        RAISE NOTICE 'Make sure you have run the vendor system migration first.';
    END;
    
    RAISE NOTICE '';
    RAISE NOTICE '📧 Email: %', test_email;
    RAISE NOTICE '👤 Name: %', test_name;
    RAISE NOTICE '📱 Phone: %', test_phone;
    RAISE NOTICE '🏦 Bank: % - %', test_bank_name, test_bank_account;
    RAISE NOTICE '';
    RAISE NOTICE '🔑 LOGIN INSTRUCTIONS:';
    RAISE NOTICE '1. Go to /vendor/login in your app';
    RAISE NOTICE '2. Use email: %', test_email;
    RAISE NOTICE '3. Use the password you set in Supabase Auth Dashboard';
    
END $$;

-- Step 4: Verify what was created
SELECT 
    'Final Verification' as check_type,
    COALESCE(v.id::text, 'NOT FOUND') as vendor_id,
    COALESCE(v.display_name, 'NOT FOUND') as vendor_name,
    COALESCE(p.role::text, 'NOT SET') as profile_role,
    COALESCE(p.is_merchant::text, 'NOT SET') as is_merchant,
    COALESCE(p.credits_balance::text, 'NOT SET') as credits_balance,
    u.email,
    u.created_at as user_created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.vendors v ON u.id = v.user_id
WHERE u.email = 'testvendor@tradehub.com';
