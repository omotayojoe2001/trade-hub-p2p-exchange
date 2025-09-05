-- FIX DATABASE SCHEMA ISSUES
-- This script ensures basic tables exist with correct structure

-- =============================================
-- 1. ENSURE PROFILES TABLE EXISTS WITH CORRECT STRUCTURE
-- =============================================

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    phone_number TEXT,
    location TEXT,
    bio TEXT,
    is_premium BOOLEAN DEFAULT false,
    is_merchant BOOLEAN DEFAULT false,
    merchant_mode BOOLEAN DEFAULT false,
    credits_balance INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policy for profiles
DROP POLICY IF EXISTS "profiles_policy" ON public.profiles;
CREATE POLICY "profiles_policy" ON public.profiles
FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 2. ENSURE TRADES TABLE EXISTS
-- =============================================

-- Create trades table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    crypto_type TEXT NOT NULL,
    amount_crypto DECIMAL NOT NULL,
    amount_fiat DECIMAL NOT NULL,
    rate DECIMAL NOT NULL,
    status TEXT DEFAULT 'pending',
    trade_type TEXT NOT NULL, -- 'buy' or 'sell'
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on trades
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- RLS policy for trades
DROP POLICY IF EXISTS "trades_policy" ON public.trades;
CREATE POLICY "trades_policy" ON public.trades 
FOR ALL USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- =============================================
-- 3. ENSURE NOTIFICATIONS TABLE EXISTS
-- =============================================

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policy for notifications
DROP POLICY IF EXISTS "notifications_policy" ON public.notifications;
CREATE POLICY "notifications_policy" ON public.notifications 
FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 4. CREATE CREDIT PURCHASE TRANSACTIONS TABLE
-- =============================================

-- Create credit purchase transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.credit_purchase_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credits_amount INTEGER NOT NULL,
    price_paid_naira DECIMAL NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on credit transactions
ALTER TABLE public.credit_purchase_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policy for credit transactions
DROP POLICY IF EXISTS "credit_transactions_policy" ON public.credit_purchase_transactions;
CREATE POLICY "credit_transactions_policy" ON public.credit_purchase_transactions 
FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 5. CREATE VENDORS TABLE (OPTIONAL)
-- =============================================

-- Create vendors table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL,
    bank_account TEXT,
    bank_name TEXT,
    bank_code TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- 6. CREATE VENDOR JOBS TABLE (OPTIONAL)
-- =============================================

-- Create vendor jobs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.vendor_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    premium_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    trade_id UUID REFERENCES public.trades(id) ON DELETE CASCADE,
    amount_usd DECIMAL NOT NULL,
    delivery_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending_payment',
    credits_required INTEGER DEFAULT 0,
    verification_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on vendor jobs
ALTER TABLE public.vendor_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policy for vendor jobs
DROP POLICY IF EXISTS "vendor_jobs_policy" ON public.vendor_jobs;
CREATE POLICY "vendor_jobs_policy" ON public.vendor_jobs 
FOR ALL USING (auth.uid() = premium_user_id OR auth.uid() = buyer_id);

-- =============================================
-- 7. CREATE FUNCTIONS FOR PREMIUM FEATURES
-- =============================================

-- Function to get credit balance
CREATE OR REPLACE FUNCTION get_credit_balance(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(
        (SELECT credits_balance FROM public.profiles WHERE user_id = p_user_id),
        0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update credit balance
CREATE OR REPLACE FUNCTION update_credit_balance(p_user_id UUID, p_amount INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.profiles
    SET credits_balance = COALESCE(credits_balance, 0) + p_amount,
        updated_at = now()
    WHERE user_id = p_user_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 8. CREATE PROFILE CREATION TRIGGER
-- =============================================

-- Function to create profile when user signs up
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, display_name, created_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email, 'User'),
        NEW.created_at
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
CREATE TRIGGER create_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_profile_for_new_user();

-- =============================================
-- 9. INSERT SAMPLE VENDOR (FOR TESTING)
-- =============================================

-- Insert a sample vendor if none exist
INSERT INTO public.vendors (display_name, bank_account, bank_name, bank_code, active)
SELECT 'TradeHub Delivery Service', '1234567890', 'First Bank', '011', true
WHERE NOT EXISTS (SELECT 1 FROM public.vendors);

-- =============================================
-- 10. CREATE PROFILES FOR EXISTING USERS
-- =============================================

-- Create profiles for existing users who don't have them
INSERT INTO public.profiles (user_id, display_name, created_at)
SELECT
    u.id,
    COALESCE(u.raw_user_meta_data->>'display_name', u.email, 'User'),
    u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL;

-- =============================================
-- 11. SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ SUCCESS: Database schema fixed!';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 TABLES CREATED/VERIFIED:';
    RAISE NOTICE '• profiles - User profile data';
    RAISE NOTICE '• trades - Trading transactions';
    RAISE NOTICE '• notifications - User notifications';
    RAISE NOTICE '• credit_purchase_transactions - Credit purchases';
    RAISE NOTICE '• vendors - Delivery vendors';
    RAISE NOTICE '• vendor_jobs - Delivery jobs';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 FUNCTIONS CREATED:';
    RAISE NOTICE '• get_credit_balance() - Get user credits';
    RAISE NOTICE '• update_credit_balance() - Update user credits';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 READY FOR TESTING:';
    RAISE NOTICE '1. Premium profile should load user data';
    RAISE NOTICE '2. Premium trades should show user trades';
    RAISE NOTICE '3. Premium notifications should work';
    RAISE NOTICE '4. Credits system should function';
END $$;
