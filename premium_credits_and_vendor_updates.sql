-- PREMIUM CREDITS AUTO-GRANT & VENDOR SYSTEM ENHANCEMENTS
-- This script adds automatic 100 credits for premium users and enhances vendor system

-- =============================================
-- 1. CREATE FUNCTION TO AUTO-GRANT CREDITS TO PREMIUM USERS
-- =============================================

CREATE OR REPLACE FUNCTION grant_premium_credits()
RETURNS TRIGGER AS $$
BEGIN
    -- If user is being upgraded to premium (is_premium changed from false to true)
    IF OLD.is_premium = false AND NEW.is_premium = true THEN
        -- Grant 100 credits automatically
        NEW.credits_balance = COALESCE(NEW.credits_balance, 0) + 100;
        
        -- Log the credit grant
        INSERT INTO public.credit_purchase_transactions (
            user_id,
            credits_amount,
            price_paid_naira,
            status,
            payment_reference,
            created_at
        ) VALUES (
            NEW.user_id,
            100,
            0,
            'paid',
            'PREMIUM_UPGRADE_BONUS_' || extract(epoch from now()),
            now()
        );
        
        RAISE NOTICE 'Granted 100 credits to premium user: %', NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic premium credit granting
DROP TRIGGER IF EXISTS trigger_grant_premium_credits ON public.profiles;
CREATE TRIGGER trigger_grant_premium_credits
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION grant_premium_credits();

-- =============================================
-- 2. GRANT CREDITS TO EXISTING PREMIUM USERS
-- =============================================

-- Update existing premium users who don't have credits yet
UPDATE public.profiles 
SET credits_balance = COALESCE(credits_balance, 0) + 100
WHERE is_premium = true 
AND COALESCE(credits_balance, 0) < 100;

-- Log credits for existing premium users
INSERT INTO public.credit_purchase_transactions (
    user_id,
    credits_amount,
    price_paid_naira,
    status,
    payment_reference,
    created_at
)
SELECT 
    user_id,
    100,
    0,
    'paid',
    'EXISTING_PREMIUM_BONUS_' || extract(epoch from now()),
    now()
FROM public.profiles 
WHERE is_premium = true
AND NOT EXISTS (
    SELECT 1 FROM public.credit_purchase_transactions 
    WHERE user_id = profiles.user_id 
    AND payment_reference LIKE '%PREMIUM%BONUS%'
);

-- =============================================
-- 3. ENHANCE VENDOR JOBS TABLE FOR MESSAGING
-- =============================================

-- Add messaging and communication fields to vendor_jobs
ALTER TABLE public.vendor_jobs ADD COLUMN IF NOT EXISTS vendor_notes TEXT;
ALTER TABLE public.vendor_jobs ADD COLUMN IF NOT EXISTS customer_notes TEXT;
ALTER TABLE public.vendor_jobs ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.vendor_jobs ADD COLUMN IF NOT EXISTS vendor_phone TEXT;
ALTER TABLE public.vendor_jobs ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- =============================================
-- 4. CREATE VENDOR MESSAGES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.vendor_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.vendor_jobs(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('vendor', 'customer')),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'location')),
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on vendor messages
ALTER TABLE public.vendor_messages ENABLE ROW LEVEL SECURITY;

-- RLS policy for vendor messages
DROP POLICY IF EXISTS "vendor_messages_policy" ON public.vendor_messages;
CREATE POLICY "vendor_messages_policy" ON public.vendor_messages 
FOR ALL USING (
    -- Vendor can see messages for their jobs
    EXISTS (
        SELECT 1 FROM public.vendor_jobs vj
        JOIN public.vendors v ON vj.vendor_id = v.id
        WHERE vj.id = job_id AND v.user_id = auth.uid()
    ) OR
    -- Premium user can see messages for their jobs
    EXISTS (
        SELECT 1 FROM public.vendor_jobs vj
        WHERE vj.id = job_id AND vj.premium_user_id = auth.uid()
    ) OR
    -- Admin can see all
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- =============================================
-- 5. CREATE TRADE REQUEST AUTO-MATCHING FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION auto_match_trade_request(
    p_premium_user_id UUID,
    p_amount_usd DECIMAL,
    p_delivery_type TEXT
)
RETURNS UUID AS $$
DECLARE
    matched_merchant_id UUID;
    new_trade_id UUID;
    vendor_job_id UUID;
BEGIN
    -- Find an available merchant who accepts trade requests
    SELECT user_id INTO matched_merchant_id
    FROM public.profiles 
    WHERE is_merchant = true 
    AND merchant_mode = true
    AND user_id != p_premium_user_id
    ORDER BY RANDOM()
    LIMIT 1;
    
    IF matched_merchant_id IS NULL THEN
        RAISE EXCEPTION 'No available merchants found for trade matching';
    END IF;
    
    -- Create a trade request
    INSERT INTO public.trades (
        seller_id,
        buyer_id,
        crypto_type,
        amount_crypto,
        amount_fiat,
        rate,
        status,
        trade_type,
        payment_method,
        created_at
    ) VALUES (
        p_premium_user_id,
        matched_merchant_id,
        'USDT', -- Default crypto
        p_amount_usd,
        p_amount_usd * 1650, -- Approximate NGN rate
        1650,
        'pending',
        'sell',
        'cash_delivery',
        now()
    ) RETURNING id INTO new_trade_id;
    
    -- Get the vendor job ID that triggered this
    SELECT id INTO vendor_job_id
    FROM public.vendor_jobs
    WHERE premium_user_id = p_premium_user_id
    AND amount_usd = p_amount_usd
    AND delivery_type = p_delivery_type
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Link the trade to the vendor job
    UPDATE public.vendor_jobs
    SET trade_id = new_trade_id
    WHERE id = vendor_job_id;
    
    RETURN new_trade_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_vendor_messages_job_id ON public.vendor_messages(job_id);
CREATE INDEX IF NOT EXISTS idx_vendor_messages_sender ON public.vendor_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_vendor_messages_created_at ON public.vendor_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON public.profiles(is_premium);
CREATE INDEX IF NOT EXISTS idx_profiles_merchant_mode ON public.profiles(merchant_mode);

-- =============================================
-- 7. UPDATE SYSTEM CONFIG FOR PREMIUM CREDITS
-- =============================================

INSERT INTO public.system_config (key, value, description) VALUES
    ('PREMIUM_SIGNUP_CREDITS', '100', 'Credits granted automatically when user upgrades to premium'),
    ('AUTO_TRADE_MATCHING', 'true', 'Automatically match premium cash requests with merchants'),
    ('VENDOR_MESSAGE_RETENTION_DAYS', '30', 'How long to keep vendor messages')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description;

-- =============================================
-- 8. CREATE TEST PREMIUM USER WITH CREDITS
-- =============================================

DO $$
DECLARE
    test_premium_id UUID;
BEGIN
    -- Get or create test premium user
    SELECT id INTO test_premium_id 
    FROM auth.users 
    WHERE email = 'premiumuser@test.com';
    
    IF test_premium_id IS NOT NULL THEN
        -- Update to premium and trigger credit grant
        UPDATE public.profiles 
        SET is_premium = true,
            credits_balance = COALESCE(credits_balance, 0) + 100
        WHERE user_id = test_premium_id;
        
        RAISE NOTICE '✅ Test premium user updated with 100 credits';
    ELSE
        RAISE NOTICE '⚠️  Test premium user not found. Create premiumuser@test.com in Supabase Auth first.';
    END IF;
END $$;

-- =============================================
-- 9. SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '✅ SUCCESS: Premium credits and vendor enhancements implemented!';
    RAISE NOTICE '✅ Auto-grant 100 credits to new premium users';
    RAISE NOTICE '✅ Granted credits to existing premium users';
    RAISE NOTICE '✅ Enhanced vendor messaging system';
    RAISE NOTICE '✅ Added auto trade request matching';
    RAISE NOTICE '✅ Created vendor communication tables';
    RAISE NOTICE '✅ Updated system configuration';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 NEXT: Update frontend to show credits in premium profiles';
    RAISE NOTICE '🎯 NEXT: Implement vendor bottom navigation';
    RAISE NOTICE '🎯 NEXT: Fix premium page colors';
    RAISE NOTICE '🎯 NEXT: Test complete premium → vendor → trade flow';
END $$;
