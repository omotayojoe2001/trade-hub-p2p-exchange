-- PREMIUM CREDITS AUTO-GRANT & VENDOR SYSTEM ENHANCEMENTS (FIXED VERSION)
-- This script adds automatic 100 credits for premium users and enhances vendor system
-- Fixed to work with existing database schema

-- =============================================
-- 1. CHECK AND ADD MISSING COLUMNS TO PROFILES TABLE
-- =============================================

-- Add is_premium column if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- Add credits_balance column if it doesn't exist (already added in vendor migration)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits_balance INTEGER DEFAULT 0;

-- Add merchant_mode column if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS merchant_mode BOOLEAN DEFAULT false;

-- =============================================
-- 2. CREATE FUNCTION TO AUTO-GRANT CREDITS TO PREMIUM USERS
-- =============================================

CREATE OR REPLACE FUNCTION grant_premium_credits()
RETURNS TRIGGER AS $$
BEGIN
    -- If user is being upgraded to premium (is_premium changed from false to true)
    IF (OLD.is_premium IS NULL OR OLD.is_premium = false) AND NEW.is_premium = true THEN
        -- Grant 100 credits automatically
        NEW.credits_balance = COALESCE(NEW.credits_balance, 0) + 100;
        
        -- Log the credit grant (only if credit_purchase_transactions table exists)
        BEGIN
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
        EXCEPTION WHEN OTHERS THEN
            -- If table doesn't exist, just continue
            RAISE NOTICE 'Could not log credit transaction: %', SQLERRM;
        END;
        
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
-- 3. GRANT CREDITS TO EXISTING PREMIUM USERS
-- =============================================

-- Update existing premium users who don't have credits yet
UPDATE public.profiles 
SET credits_balance = COALESCE(credits_balance, 0) + 100
WHERE COALESCE(is_premium, false) = true 
AND COALESCE(credits_balance, 0) < 100;

-- Log credits for existing premium users (if table exists)
DO $$
BEGIN
    BEGIN
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
        WHERE COALESCE(is_premium, false) = true
        AND NOT EXISTS (
            SELECT 1 FROM public.credit_purchase_transactions 
            WHERE user_id = profiles.user_id 
            AND payment_reference LIKE '%PREMIUM%BONUS%'
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not log existing premium credits: %', SQLERRM;
    END;
END $$;

-- =============================================
-- 4. ENHANCE VENDOR JOBS TABLE FOR MESSAGING (IF EXISTS)
-- =============================================

DO $$
BEGIN
    -- Check if vendor_jobs table exists before altering
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_jobs' AND table_schema = 'public') THEN
        -- Add messaging and communication fields to vendor_jobs
        ALTER TABLE public.vendor_jobs ADD COLUMN IF NOT EXISTS vendor_notes TEXT;
        ALTER TABLE public.vendor_jobs ADD COLUMN IF NOT EXISTS customer_notes TEXT;
        ALTER TABLE public.vendor_jobs ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE public.vendor_jobs ADD COLUMN IF NOT EXISTS vendor_phone TEXT;
        ALTER TABLE public.vendor_jobs ADD COLUMN IF NOT EXISTS customer_phone TEXT;
        
        RAISE NOTICE 'Enhanced vendor_jobs table with messaging fields';
    ELSE
        RAISE NOTICE 'vendor_jobs table not found - run vendor system migration first';
    END IF;
END $$;

-- =============================================
-- 5. CREATE VENDOR MESSAGES TABLE (IF VENDOR SYSTEM EXISTS)
-- =============================================

DO $$
BEGIN
    -- Only create if vendor_jobs table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_jobs' AND table_schema = 'public') THEN
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
        
        RAISE NOTICE 'Created vendor_messages table with RLS policies';
    END IF;
END $$;

-- =============================================
-- 6. CREATE TRADE REQUEST AUTO-MATCHING FUNCTION (IF TRADES TABLE EXISTS)
-- =============================================

DO $$
BEGIN
    -- Only create if trades table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trades' AND table_schema = 'public') THEN
        CREATE OR REPLACE FUNCTION auto_match_trade_request(
            p_premium_user_id UUID,
            p_amount_usd DECIMAL,
            p_delivery_type TEXT
        )
        RETURNS UUID AS $func$
        DECLARE
            matched_merchant_id UUID;
            new_trade_id UUID;
            vendor_job_id UUID;
        BEGIN
            -- Find an available merchant who accepts trade requests
            SELECT user_id INTO matched_merchant_id
            FROM public.profiles 
            WHERE COALESCE(is_merchant, false) = true 
            AND COALESCE(merchant_mode, false) = true
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
            
            -- Get the vendor job ID that triggered this (if vendor system exists)
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_jobs' AND table_schema = 'public') THEN
                SELECT id INTO vendor_job_id
                FROM public.vendor_jobs
                WHERE premium_user_id = p_premium_user_id
                AND amount_usd = p_amount_usd
                AND delivery_type = p_delivery_type
                ORDER BY created_at DESC
                LIMIT 1;
                
                -- Link the trade to the vendor job
                IF vendor_job_id IS NOT NULL THEN
                    UPDATE public.vendor_jobs
                    SET trade_id = new_trade_id
                    WHERE id = vendor_job_id;
                END IF;
            END IF;
            
            RETURN new_trade_id;
        END;
        $func$ LANGUAGE plpgsql;
        
        RAISE NOTICE 'Created auto_match_trade_request function';
    ELSE
        RAISE NOTICE 'trades table not found - trade matching function not created';
    END IF;
END $$;

-- =============================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Create indexes only if tables exist
DO $$
BEGIN
    -- Vendor messages indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_messages' AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_vendor_messages_job_id ON public.vendor_messages(job_id);
        CREATE INDEX IF NOT EXISTS idx_vendor_messages_sender ON public.vendor_messages(sender_id);
        CREATE INDEX IF NOT EXISTS idx_vendor_messages_created_at ON public.vendor_messages(created_at DESC);
    END IF;
    
    -- Profiles indexes
    CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON public.profiles(is_premium);
    CREATE INDEX IF NOT EXISTS idx_profiles_merchant_mode ON public.profiles(merchant_mode);
    CREATE INDEX IF NOT EXISTS idx_profiles_is_merchant ON public.profiles(is_merchant);
END $$;

-- =============================================
-- 8. UPDATE SYSTEM CONFIG FOR PREMIUM CREDITS (IF TABLE EXISTS)
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_config' AND table_schema = 'public') THEN
        INSERT INTO public.system_config (key, value, description) VALUES
            ('PREMIUM_SIGNUP_CREDITS', '100', 'Credits granted automatically when user upgrades to premium'),
            ('AUTO_TRADE_MATCHING', 'true', 'Automatically match premium cash requests with merchants'),
            ('VENDOR_MESSAGE_RETENTION_DAYS', '30', 'How long to keep vendor messages')
        ON CONFLICT (key) DO UPDATE SET
            value = EXCLUDED.value,
            description = EXCLUDED.description;
            
        RAISE NOTICE 'Updated system configuration';
    END IF;
END $$;

-- =============================================
-- 9. CREATE TEST PREMIUM USER WITH CREDITS
-- =============================================

DO $$
DECLARE
    test_premium_id UUID;
BEGIN
    -- Get test premium user if exists
    SELECT id INTO test_premium_id 
    FROM auth.users 
    WHERE email = 'premiumuser@test.com';
    
    IF test_premium_id IS NOT NULL THEN
        -- Update to premium and add credits
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
-- 10. SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ SUCCESS: Premium credits system implemented (FIXED VERSION)!';
    RAISE NOTICE '✅ Added is_premium column to profiles table';
    RAISE NOTICE '✅ Auto-grant 100 credits to new premium users (trigger created)';
    RAISE NOTICE '✅ Granted credits to existing premium users';
    RAISE NOTICE '✅ Enhanced vendor system (if tables exist)';
    RAISE NOTICE '✅ Added auto trade request matching (if trades table exists)';
    RAISE NOTICE '✅ Created vendor communication system (if vendor system exists)';
    RAISE NOTICE '✅ Updated system configuration (if table exists)';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 WHAT WORKS NOW:';
    RAISE NOTICE '• Premium users automatically get 100 credits';
    RAISE NOTICE '• Credits show in premium profile';
    RAISE NOTICE '• Vendor system enhanced (if vendor migration was run)';
    RAISE NOTICE '• Auto trade matching (if trades table exists)';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TEST:';
    RAISE NOTICE '1. Set a user to is_premium = true in profiles table';
    RAISE NOTICE '2. Check they automatically get 100 credits';
    RAISE NOTICE '3. View premium profile to see credits display';
    RAISE NOTICE '4. Test premium cash service flow';
END $$;
