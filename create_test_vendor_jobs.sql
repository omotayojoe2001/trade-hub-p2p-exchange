-- CREATE TEST VENDOR JOBS FOR DEMONSTRATION
-- This creates sample pickup/delivery jobs so you can see the vendor interface in action

DO $$
DECLARE
    test_vendor_id UUID;
    test_premium_user_id UUID;
    test_buyer_user_id UUID;
    job1_id UUID;
    job2_id UUID;
BEGIN
    -- Get the test vendor ID
    SELECT id INTO test_vendor_id 
    FROM public.vendors 
    WHERE user_id IN (
        SELECT id FROM auth.users WHERE email = 'testvendor@tradehub.com'
    );
    
    IF test_vendor_id IS NULL THEN
        RAISE EXCEPTION 'Test vendor not found. Please create vendor first.';
    END IF;
    
    -- Get existing premium user (must be created via Supabase Auth Dashboard first)
    SELECT id INTO test_premium_user_id
    FROM auth.users
    WHERE email = 'premiumuser@test.com';

    -- If user doesn't exist, create a dummy UUID for testing
    IF test_premium_user_id IS NULL THEN
        test_premium_user_id := gen_random_uuid();
        RAISE NOTICE 'WARNING: Premium user not found. Creating test profile with dummy ID.';
        RAISE NOTICE 'For full testing, create premiumuser@test.com in Supabase Auth Dashboard first.';
    END IF;
    
    -- Create profile for premium user
    INSERT INTO public.profiles (
        user_id,
        display_name,
        phone_number,
        is_merchant,
        credits_balance,
        created_at
    ) VALUES (
        test_premium_user_id,
        'John Premium',
        '+2348012345678',
        false,
        100,
        now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        credits_balance = EXCLUDED.credits_balance;
    
    -- Get existing buyer user (must be created via Supabase Auth Dashboard first)
    SELECT id INTO test_buyer_user_id
    FROM auth.users
    WHERE email = 'buyer@test.com';

    -- If user doesn't exist, create a dummy UUID for testing
    IF test_buyer_user_id IS NULL THEN
        test_buyer_user_id := gen_random_uuid();
        RAISE NOTICE 'WARNING: Buyer user not found. Creating test profile with dummy ID.';
        RAISE NOTICE 'For full testing, create buyer@test.com in Supabase Auth Dashboard first.';
    END IF;
    
    -- Create profile for buyer
    INSERT INTO public.profiles (
        user_id,
        display_name,
        phone_number,
        is_merchant,
        created_at
    ) VALUES (
        test_buyer_user_id,
        'Alice Buyer',
        '+2348087654321',
        false,
        now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        display_name = EXCLUDED.display_name;
    
    -- Create Test Job 1: Cash Delivery (Pending Payment)
    INSERT INTO public.vendor_jobs (
        vendor_id,
        premium_user_id,
        buyer_id,
        amount_usd,
        delivery_type,
        status,
        credits_required,
        address_json,
        created_at
    ) VALUES (
        test_vendor_id,
        test_premium_user_id,
        test_buyer_user_id,
        250.00,
        'delivery',
        'pending_payment',
        25,
        '{"street": "123 Lagos Street", "city": "Lagos", "state": "Lagos", "country": "Nigeria"}',
        now()
    )
    RETURNING id INTO job1_id;
    
    -- Create Test Job 2: Cash Pickup (Payment Received)
    INSERT INTO public.vendor_jobs (
        vendor_id,
        premium_user_id,
        buyer_id,
        amount_usd,
        amount_naira_received,
        delivery_type,
        status,
        credits_required,
        payment_received_at,
        address_json,
        created_at
    ) VALUES (
        test_vendor_id,
        test_premium_user_id,
        test_buyer_user_id,
        100.00,
        165000.00,
        'pickup',
        'payment_received',
        10,
        now() - interval '5 minutes',
        '{"street": "456 Abuja Road", "city": "Abuja", "state": "FCT", "country": "Nigeria"}',
        now() - interval '10 minutes'
    )
    RETURNING id INTO job2_id;
    
    RAISE NOTICE '✅ TEST VENDOR JOBS CREATED SUCCESSFULLY!';
    RAISE NOTICE '';
    RAISE NOTICE '📦 Job 1 (Delivery): $250 - Status: Pending Payment';
    RAISE NOTICE '   - Customer: John Premium';
    RAISE NOTICE '   - Buyer needs to pay ₦412,500 to vendor account';
    RAISE NOTICE '   - Vendor will deliver $250 cash to John Premium';
    RAISE NOTICE '';
    RAISE NOTICE '📦 Job 2 (Pickup): $100 - Status: Payment Received';
    RAISE NOTICE '   - Customer: John Premium';
    RAISE NOTICE '   - ₦165,000 already received from buyer';
    RAISE NOTICE '   - Ready for vendor to deliver $100 to John Premium';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 NOW TEST THE COMPLETE FLOW:';
    RAISE NOTICE '1. Login to /vendor/login with testvendor@tradehub.com';
    RAISE NOTICE '2. You should see 2 active delivery requests';
    RAISE NOTICE '3. Test "I Received Payment" button on Job 1';
    RAISE NOTICE '4. Test "Complete Delivery" button on Job 2';
    RAISE NOTICE '5. Test premium user flow at /premium/cash-service';
    RAISE NOTICE '6. Test buyer payment flow at /vendor-bank-details';
    
END $$;

-- Verify the test jobs were created
SELECT 
    'Test Jobs Created' as status,
    vj.id,
    vj.delivery_type,
    vj.amount_usd,
    vj.status,
    vj.amount_naira_received,
    p.display_name as customer_name,
    p.phone_number as customer_phone
FROM public.vendor_jobs vj
JOIN public.profiles p ON vj.premium_user_id = p.user_id
WHERE vj.vendor_id IN (
    SELECT id FROM public.vendors 
    WHERE user_id IN (
        SELECT id FROM auth.users WHERE email = 'testvendor@tradehub.com'
    )
)
ORDER BY vj.created_at DESC;
