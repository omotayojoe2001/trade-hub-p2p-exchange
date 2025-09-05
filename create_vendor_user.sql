-- SCRIPT TO CREATE VENDOR USERS
-- Run this after creating the user via Supabase Auth Dashboard

-- Step 1: First create the user via Supabase Auth Dashboard with email/password
-- Step 2: Then run this script to set up the vendor profile

-- Example: Create a vendor user
-- Replace these values with actual user details

DO $$
DECLARE
    vendor_user_id UUID;
    vendor_email TEXT := 'vendor1@tradehub.com'; -- Replace with actual email
    vendor_name TEXT := 'John Vendor'; -- Replace with actual name
    vendor_phone TEXT := '+2348012345678'; -- Replace with actual phone
    vendor_bank_account TEXT := '1234567890'; -- Replace with actual bank account
    vendor_bank_name TEXT := 'First Bank'; -- Replace with actual bank name
    vendor_bank_code TEXT := '011'; -- Replace with actual bank code
BEGIN
    -- Get the user ID from auth.users (user must exist first)
    SELECT id INTO vendor_user_id 
    FROM auth.users 
    WHERE email = vendor_email;
    
    IF vendor_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found. Please create user first via Supabase Auth Dashboard.', vendor_email;
    END IF;
    
    -- Update the user's profile to vendor role
    INSERT INTO public.profiles (
        user_id, 
        display_name, 
        phone_number, 
        role,
        is_merchant,
        created_at
    ) VALUES (
        vendor_user_id,
        vendor_name,
        vendor_phone,
        'vendor',
        true,
        now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        phone_number = EXCLUDED.phone_number,
        role = EXCLUDED.role,
        is_merchant = EXCLUDED.is_merchant;
    
    -- Create the vendor profile
    INSERT INTO public.vendors (
        user_id,
        display_name,
        phone,
        bank_account,
        bank_name,
        bank_code,
        active
    ) VALUES (
        vendor_user_id,
        vendor_name,
        vendor_phone,
        vendor_bank_account,
        vendor_bank_name,
        vendor_bank_code,
        true
    )
    ON CONFLICT (user_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        phone = EXCLUDED.phone,
        bank_account = EXCLUDED.bank_account,
        bank_name = EXCLUDED.bank_name,
        bank_code = EXCLUDED.bank_code,
        active = EXCLUDED.active;
    
    RAISE NOTICE '✅ Vendor user created successfully!';
    RAISE NOTICE 'User ID: %', vendor_user_id;
    RAISE NOTICE 'Email: %', vendor_email;
    RAISE NOTICE 'Name: %', vendor_name;
    RAISE NOTICE 'Phone: %', vendor_phone;
    RAISE NOTICE 'Bank: % - %', vendor_bank_name, vendor_bank_account;
    
END $$;

-- You can also create multiple vendors by running this block multiple times with different values

-- Example 2: Create another vendor
/*
DO $$
DECLARE
    vendor_user_id UUID;
    vendor_email TEXT := 'vendor2@tradehub.com';
    vendor_name TEXT := 'Jane Vendor';
    vendor_phone TEXT := '+2348087654321';
    vendor_bank_account TEXT := '0987654321';
    vendor_bank_name TEXT := 'GTBank';
    vendor_bank_code TEXT := '058';
BEGIN
    SELECT id INTO vendor_user_id FROM auth.users WHERE email = vendor_email;
    
    IF vendor_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found. Please create user first.', vendor_email;
    END IF;
    
    INSERT INTO public.profiles (user_id, display_name, phone_number, role, is_merchant, created_at)
    VALUES (vendor_user_id, vendor_name, vendor_phone, 'vendor', true, now())
    ON CONFLICT (user_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        phone_number = EXCLUDED.phone_number,
        role = EXCLUDED.role,
        is_merchant = EXCLUDED.is_merchant;
    
    INSERT INTO public.vendors (user_id, display_name, phone, bank_account, bank_name, bank_code, active)
    VALUES (vendor_user_id, vendor_name, vendor_phone, vendor_bank_account, vendor_bank_name, vendor_bank_code, true)
    ON CONFLICT (user_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        phone = EXCLUDED.phone,
        bank_account = EXCLUDED.bank_account,
        bank_name = EXCLUDED.bank_name,
        bank_code = EXCLUDED.bank_code,
        active = EXCLUDED.active;
    
    RAISE NOTICE '✅ Second vendor user created successfully!';
    RAISE NOTICE 'User ID: %', vendor_user_id;
    RAISE NOTICE 'Email: %', vendor_email;
    
END $$;
*/

-- Query to check all vendors
SELECT 
    v.id as vendor_id,
    v.display_name,
    v.phone,
    v.bank_name,
    v.bank_account,
    v.active,
    p.role,
    u.email
FROM public.vendors v
JOIN public.profiles p ON v.user_id = p.user_id
JOIN auth.users u ON v.user_id = u.id
ORDER BY v.created_at DESC;
