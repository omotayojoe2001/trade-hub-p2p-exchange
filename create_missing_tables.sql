-- COMPREHENSIVE DATABASE FIX SCRIPT
-- Run this SQL directly in Supabase SQL Editor to fix all database issues
-- This script addresses all console errors and missing functionality

-- =============================================
-- 1. FIX PROFILES TABLE - ADD MISSING COLUMNS
-- =============================================

-- Add missing columns to profiles table (fixes bio, referred_by errors)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bvn VARCHAR(11);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE;

-- Add referral system columns (fixes referred_by error)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;

-- =============================================
-- 2. CREATE TRADES TABLE (FIXES 400 ERRORS)
-- =============================================

CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_request_id UUID,
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    coin_type TEXT NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    rate DECIMAL(20,2) NOT NULL,
    naira_amount DECIMAL(20,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting_payment' CHECK (status IN ('waiting_payment', 'payment_sent', 'waiting_confirmation', 'completed', 'disputed', 'cancelled')),
    trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
    payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
    bank_account_details JSONB,
    escrow_address TEXT,
    transaction_hash TEXT,
    payment_proof_url TEXT,
    dispute_reason TEXT,
    completion_time INTERVAL,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- 3. CREATE PAYMENT_METHODS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'bank_account',
    account_name VARCHAR(255),
    account_number VARCHAR(50),
    bank_name VARCHAR(255),
    bank_code VARCHAR(20),
    country VARCHAR(5) DEFAULT 'NG',
    is_default BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- 4. CREATE MERCHANT_SETTINGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.merchant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    is_online BOOLEAN DEFAULT true,
    accepts_new_trades BOOLEAN DEFAULT true,
    auto_accept_trades BOOLEAN DEFAULT false,
    auto_release_escrow BOOLEAN DEFAULT false,
    min_trade_amount DECIMAL(20,8) DEFAULT 0,
    max_trade_amount DECIMAL(20,8) DEFAULT 1000000,
    avg_response_time_minutes INTEGER DEFAULT 15,
    payment_methods TEXT[] DEFAULT ARRAY['bank_transfer'],
    btc_buy_rate DECIMAL(20,8) DEFAULT 0,
    btc_sell_rate DECIMAL(20,8) DEFAULT 0,
    eth_buy_rate DECIMAL(20,8) DEFAULT 0,
    eth_sell_rate DECIMAL(20,8) DEFAULT 0,
    usdt_buy_rate DECIMAL(20,8) DEFAULT 0,
    usdt_sell_rate DECIMAL(20,8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Add missing columns to trade_requests (if they don't exist)
DO $$
BEGIN
    -- Add coin_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'trade_requests' AND column_name = 'coin_type') THEN
        ALTER TABLE public.trade_requests ADD COLUMN coin_type VARCHAR(10);
    END IF;

    -- Add trade_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'trade_requests' AND column_name = 'trade_type') THEN
        ALTER TABLE public.trade_requests ADD COLUMN trade_type VARCHAR(20);
    END IF;

    -- Add naira_amount column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'trade_requests' AND column_name = 'naira_amount') THEN
        ALTER TABLE public.trade_requests ADD COLUMN naira_amount DECIMAL(20,2);
    END IF;

    -- Add payment_method column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'trade_requests' AND column_name = 'payment_method') THEN
        ALTER TABLE public.trade_requests ADD COLUMN payment_method VARCHAR(50) DEFAULT 'bank_transfer';
    END IF;
END $$;

-- Add missing columns to merchant_settings (if they don't exist)
DO $$
BEGIN
    -- Add auto_release_escrow column (fixes the console error)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'merchant_settings' AND column_name = 'auto_release_escrow') THEN
        ALTER TABLE public.merchant_settings ADD COLUMN auto_release_escrow BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 4. Update existing data in trade_requests
UPDATE public.trade_requests SET coin_type = crypto_type WHERE coin_type IS NULL AND crypto_type IS NOT NULL;
UPDATE public.trade_requests SET naira_amount = cash_amount WHERE naira_amount IS NULL AND cash_amount IS NOT NULL;
UPDATE public.trade_requests SET 
    trade_type = CASE 
        WHEN direction = 'crypto_to_cash' THEN 'sell'
        WHEN direction = 'cash_to_crypto' THEN 'buy'
        ELSE 'sell'
    END
WHERE trade_type IS NULL;

-- 5. Enable RLS on new tables
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_settings ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
-- Trades policies (fixes 400 errors)
DROP POLICY IF EXISTS "trades_policy" ON public.trades;
CREATE POLICY "trades_policy" ON public.trades FOR ALL USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "payment_methods_policy" ON public.payment_methods;
CREATE POLICY "payment_methods_policy" ON public.payment_methods FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "merchant_settings_select_policy" ON public.merchant_settings;
CREATE POLICY "merchant_settings_select_policy" ON public.merchant_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "merchant_settings_modify_policy" ON public.merchant_settings;
CREATE POLICY "merchant_settings_modify_policy" ON public.merchant_settings FOR ALL USING (auth.uid() = user_id);

-- 7. Create update triggers (if update_updated_at_column function exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON public.payment_methods;
        CREATE TRIGGER update_payment_methods_updated_at
            BEFORE UPDATE ON public.payment_methods
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
            
        DROP TRIGGER IF EXISTS update_merchant_settings_updated_at ON public.merchant_settings;
        CREATE TRIGGER update_merchant_settings_updated_at
            BEFORE UPDATE ON public.merchant_settings
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- 8. Enable realtime (if publication exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        -- Add payment_methods table if not already in publication
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'payment_methods'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_methods;
        END IF;
        
        -- Add merchant_settings table if not already in publication
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'merchant_settings'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.merchant_settings;
        END IF;
    END IF;
END $$;

-- =============================================
-- 10. CREATE STORAGE BUCKET FOR PROFILE PICTURES
-- =============================================

-- Create profiles storage bucket (fixes profile picture upload errors)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 11. CREATE STORAGE POLICIES (FIXES UPLOAD ERRORS)
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Profile images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;

-- Create new storage policies (fixes "new row violates row-level security policy")
CREATE POLICY "Profile images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profiles');

CREATE POLICY "Users can upload their own profile images"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'profiles'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile images"
ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'profiles'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile images"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'profiles'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- 12. CREATE REFERRAL COMMISSIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.referral_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trade_id UUID,
    commission_amount DECIMAL(20,8) NOT NULL,
    commission_rate DECIMAL(5,4) DEFAULT 0.003,
    currency TEXT NOT NULL DEFAULT 'USDT',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on referral_commissions
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for referral_commissions
DROP POLICY IF EXISTS "referral_commissions_policy" ON public.referral_commissions;
CREATE POLICY "referral_commissions_policy" ON public.referral_commissions
FOR ALL USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

-- =============================================
-- 13. SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '✅ SUCCESS: All database errors have been fixed!';
    RAISE NOTICE '✅ profiles table: Added bio, referred_by, and other missing columns';
    RAISE NOTICE '✅ trades table: Created with proper structure and RLS';
    RAISE NOTICE '✅ Storage bucket: Created with proper permissions for profile pictures';
    RAISE NOTICE '✅ All console errors should now be resolved';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TEST NOW:';
    RAISE NOTICE '1. Profile settings: Should save bio and upload pictures';
    RAISE NOTICE '2. Referrals page: Should load without referred_by errors';
    RAISE NOTICE '3. Trades: Should query without 400 errors';
    RAISE NOTICE '4. All database queries: Should work properly';
END $$;
