-- SIMPLE TEST VENDOR CREATION
-- This creates a vendor profile for an existing user
-- First create the user via Supabase Auth Dashboard, then run this

-- Test Vendor Details (modify as needed)
DO $$
DECLARE
    test_user_id UUID;
    test_email TEXT := 'testvendor@tradehub.com';
    test_name TEXT := 'Test Vendor';
    test_phone TEXT := '+2348012345678';
    test_bank_account TEXT := '1234567890';
    test_bank_name TEXT := 'First Bank';
    test_bank_code TEXT := '011';
BEGIN
    -- Check if user exists in auth.users
    SELECT id INTO test_user_id 
    FROM auth.users 
    WHERE email = test_email;
    
    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found. Please create this user first in Supabase Auth Dashboard with email: % and any password you choose.', test_email, test_email;
    END IF;
    
    -- Create or update profile
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
        is_merchant = EXCLUDED.is_merchant;
    
    -- Create vendor profile
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
    
    RAISE NOTICE '✅ TEST VENDOR CREATED SUCCESSFULLY!';
    RAISE NOTICE '📧 Email: %', test_email;
    RAISE NOTICE '👤 Name: %', test_name;
    RAISE NOTICE '📱 Phone: %', test_phone;
    RAISE NOTICE '🏦 Bank: % - %', test_bank_name, test_bank_account;
    RAISE NOTICE '';
    RAISE NOTICE '🔑 LOGIN INSTRUCTIONS:';
    RAISE NOTICE '1. Go to /vendor/login in your app';
    RAISE NOTICE '2. Use email: %', test_email;
    RAISE NOTICE '3. Use the password you set in Supabase Auth Dashboard';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  If you get "password incorrect", the user might not exist in auth.users';
    RAISE NOTICE '   Create the user first in Supabase Dashboard → Auth → Users → Add User';
    
END $$;

-- Verify the vendor was created
SELECT 
    'Vendor Profile Check' as check_type,
    v.id as vendor_id,
    v.display_name,
    v.phone,
    v.bank_name,
    v.bank_account,
    v.active,
    p.role,
    p.is_merchant,
    p.credits_balance,
    u.email,
    u.created_at as user_created_at
FROM public.vendors v
JOIN public.profiles p ON v.user_id = p.user_id
JOIN auth.users u ON v.user_id = u.id
WHERE u.email = 'testvendor@tradehub.com'
ORDER BY v.created_at DESC;
