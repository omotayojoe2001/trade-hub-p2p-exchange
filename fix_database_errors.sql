-- COMPREHENSIVE DATABASE FIX SCRIPT
-- Run this SQL directly in Supabase SQL Editor to fix all console errors
-- This addresses: profiles.bio, profiles.referred_by, trades table, storage permissions

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
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS merchant_settings JSONB;

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
-- 3. CREATE TRADE_REQUESTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.trade_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
    coin_type TEXT NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    naira_amount DECIMAL(20,2) NOT NULL,
    rate DECIMAL(20,2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
    bank_account_details JSONB,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'matched', 'cancelled', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '24 hours'),
    matched_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- 4. CREATE NOTIFICATIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'trade', 'system')),
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- 5. CREATE REFERRAL COMMISSIONS TABLE
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

-- =============================================
-- 6. CREATE STORAGE BUCKET FOR PROFILE PICTURES
-- =============================================

-- Create profiles storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 7. CREATE STORAGE POLICIES (FIXES UPLOAD ERRORS)
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Profile images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;

-- Create new storage policies
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
-- 8. ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 9. CREATE RLS POLICIES
-- =============================================

-- Trades policies
DROP POLICY IF EXISTS "trades_policy" ON public.trades;
CREATE POLICY "trades_policy" ON public.trades 
FOR ALL USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Trade requests policies
DROP POLICY IF EXISTS "trade_requests_select_policy" ON public.trade_requests;
CREATE POLICY "trade_requests_select_policy" ON public.trade_requests 
FOR SELECT USING (status = 'open' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "trade_requests_modify_policy" ON public.trade_requests;
CREATE POLICY "trade_requests_modify_policy" ON public.trade_requests 
FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
DROP POLICY IF EXISTS "notifications_policy" ON public.notifications;
CREATE POLICY "notifications_policy" ON public.notifications 
FOR ALL USING (auth.uid() = user_id);

-- Referral commissions policies
DROP POLICY IF EXISTS "referral_commissions_policy" ON public.referral_commissions;
CREATE POLICY "referral_commissions_policy" ON public.referral_commissions 
FOR ALL USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

-- =============================================
-- 10. CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_trades_buyer_id ON public.trades(buyer_id);
CREATE INDEX IF NOT EXISTS idx_trades_seller_id ON public.trades(seller_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON public.trades(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trade_requests_user_id ON public.trade_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_requests_status ON public.trade_requests(status);
CREATE INDEX IF NOT EXISTS idx_trade_requests_coin_type ON public.trade_requests(coin_type);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- =============================================
-- 11. SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '✅ SUCCESS: All database errors have been fixed!';
    RAISE NOTICE '✅ profiles table: Added bio, referred_by, and other missing columns';
    RAISE NOTICE '✅ trades table: Created with proper structure and RLS';
    RAISE NOTICE '✅ Storage bucket: Created with proper permissions';
    RAISE NOTICE '✅ All console errors should now be resolved';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TEST NOW:';
    RAISE NOTICE '1. Profile settings: Should save bio and upload pictures';
    RAISE NOTICE '2. Referrals page: Should load without errors';
    RAISE NOTICE '3. Trades: Should query without 400 errors';
    RAISE NOTICE '4. All database queries: Should work properly';
END $$;
