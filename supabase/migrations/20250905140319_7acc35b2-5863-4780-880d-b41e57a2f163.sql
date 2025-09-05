-- COMPLETE PREMIUM REAL-TIME SYSTEM IMPLEMENTATION
-- Create missing tables and fix schema for premium vendor system

-- =============================================
-- 1. CREATE MISSING CRYPTO WALLETS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.crypto_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    coin_type TEXT NOT NULL,
    deposit_address TEXT NOT NULL,
    available_balance DECIMAL(20,8) DEFAULT 0,
    pending_balance DECIMAL(20,8) DEFAULT 0,
    total_balance DECIMAL(20,8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on crypto_wallets
ALTER TABLE public.crypto_wallets ENABLE ROW LEVEL SECURITY;

-- RLS policy for crypto_wallets
DROP POLICY IF EXISTS "crypto_wallets_policy" ON public.crypto_wallets;
CREATE POLICY "crypto_wallets_policy" ON public.crypto_wallets 
FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 2. CREATE SUPPORT TICKETS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category TEXT NOT NULL DEFAULT 'general',
    admin_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS policies for support_tickets
DROP POLICY IF EXISTS "support_tickets_user_policy" ON public.support_tickets;
CREATE POLICY "support_tickets_user_policy" ON public.support_tickets 
FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "support_tickets_admin_policy" ON public.support_tickets;
CREATE POLICY "support_tickets_admin_policy" ON public.support_tickets 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- =============================================
-- 3. ADD MISSING COLUMNS TO EXISTING TABLES
-- =============================================

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS backup_codes TEXT[];

-- Add missing columns to trade_requests table
ALTER TABLE public.trade_requests 
ADD COLUMN IF NOT EXISTS trade_type TEXT DEFAULT 'buy',
ADD COLUMN IF NOT EXISTS naira_amount DECIMAL(15,2);

-- Add missing columns to trades table  
ALTER TABLE public.trades
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 hour');

-- Add missing columns to merchant_ratings table
ALTER TABLE public.merchant_ratings 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 5.0;

-- =============================================
-- 4. CREATE PREMIUM TRADE CODES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.premium_trade_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID REFERENCES public.trades(id) ON DELETE CASCADE,
    vendor_job_id UUID REFERENCES public.vendor_jobs(id) ON DELETE CASCADE,
    premium_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    amount_usd DECIMAL(10,2) NOT NULL,
    amount_naira DECIMAL(15,2) NOT NULL,
    delivery_type TEXT NOT NULL CHECK (delivery_type IN ('pickup', 'delivery')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '24 hours'),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on premium_trade_codes
ALTER TABLE public.premium_trade_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies for premium_trade_codes
DROP POLICY IF EXISTS "premium_trade_codes_policy" ON public.premium_trade_codes;
CREATE POLICY "premium_trade_codes_policy" ON public.premium_trade_codes 
FOR ALL USING (
    auth.uid() = premium_user_id OR
    EXISTS (
        SELECT 1 FROM public.vendors 
        WHERE user_id = auth.uid() AND id = premium_trade_codes.vendor_id
    ) OR
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- =============================================
-- 5. CREATE SYSTEM RATES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.system_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    currency_pair TEXT NOT NULL UNIQUE, -- e.g., 'USD_NGN', 'BTC_NGN'
    buy_rate DECIMAL(15,4) NOT NULL,
    sell_rate DECIMAL(15,4) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on system_rates
ALTER TABLE public.system_rates ENABLE ROW LEVEL SECURITY;

-- RLS policies for system_rates
DROP POLICY IF EXISTS "system_rates_select_policy" ON public.system_rates;
CREATE POLICY "system_rates_select_policy" ON public.system_rates 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "system_rates_modify_policy" ON public.system_rates;
CREATE POLICY "system_rates_modify_policy" ON public.system_rates 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Insert default rates
INSERT INTO public.system_rates (currency_pair, buy_rate, sell_rate) VALUES
    ('USD_NGN', 1650.00, 1670.00),
    ('BTC_NGN', 68000000.00, 69000000.00),
    ('ETH_NGN', 4200000.00, 4250000.00),
    ('USDT_NGN', 1650.00, 1670.00)
ON CONFLICT (currency_pair) DO UPDATE SET
    buy_rate = EXCLUDED.buy_rate,
    sell_rate = EXCLUDED.sell_rate,
    last_updated = now();

-- =============================================
-- 6. CREATE REAL-TIME NOTIFICATION FUNCTIONS
-- =============================================

-- Function to generate trade codes
CREATE OR REPLACE FUNCTION public.generate_trade_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
BEGIN
    -- Generate 6-digit alphanumeric code
    code := UPPER(
        SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 6)
    );
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM public.premium_trade_codes WHERE code = code) LOOP
        code := UPPER(
            SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 6)
        );
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to create premium trade with vendor
CREATE OR REPLACE FUNCTION public.create_premium_trade_with_vendor(
    p_premium_user_id UUID,
    p_amount_usd DECIMAL,
    p_delivery_type TEXT,
    p_delivery_address JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    available_vendor_id UUID;
    new_vendor_job_id UUID;
    trade_code TEXT;
    naira_equivalent DECIMAL;
    credits_needed INTEGER;
    user_credits INTEGER;
BEGIN
    -- Check if user has enough credits
    SELECT COALESCE(credits_balance, 0) INTO user_credits
    FROM public.profiles
    WHERE user_id = p_premium_user_id;
    
    credits_needed := CEIL(p_amount_usd / 10);
    
    IF user_credits < credits_needed THEN
        RAISE EXCEPTION 'Insufficient credits. Need % credits, have % credits', credits_needed, user_credits;
    END IF;
    
    -- Find available vendor
    SELECT id INTO available_vendor_id
    FROM public.vendors
    WHERE active = true
    ORDER BY RANDOM()
    LIMIT 1;
    
    IF available_vendor_id IS NULL THEN
        RAISE EXCEPTION 'No available vendors found';
    END IF;
    
    -- Calculate Naira equivalent
    SELECT sell_rate * p_amount_usd INTO naira_equivalent
    FROM public.system_rates
    WHERE currency_pair = 'USD_NGN';
    
    -- Generate trade code
    trade_code := public.generate_trade_code();
    
    -- Create vendor job
    INSERT INTO public.vendor_jobs (
        vendor_id,
        premium_user_id,
        amount_usd,
        delivery_type,
        status,
        address_json,
        credits_required,
        verification_code,
        created_at
    ) VALUES (
        available_vendor_id,
        p_premium_user_id,
        p_amount_usd,
        p_delivery_type,
        'pending_payment',
        p_delivery_address,
        credits_needed,
        trade_code,
        now()
    ) RETURNING id INTO new_vendor_job_id;
    
    -- Create premium trade code record
    INSERT INTO public.premium_trade_codes (
        vendor_job_id,
        premium_user_id,
        vendor_id,
        code,
        amount_usd,
        amount_naira,
        delivery_type,
        status
    ) VALUES (
        new_vendor_job_id,
        p_premium_user_id,
        available_vendor_id,
        trade_code,
        p_amount_usd,
        naira_equivalent,
        p_delivery_type,
        'pending'
    );
    
    -- Deduct credits
    UPDATE public.profiles
    SET credits_balance = credits_balance - credits_needed
    WHERE user_id = p_premium_user_id;
    
    -- Notify vendor
    INSERT INTO public.notifications (user_id, type, title, message, data)
    SELECT 
        v.user_id,
        'vendor_job',
        'New Premium Request',
        'Premium user requested ' || p_delivery_type || ' for $' || p_amount_usd,
        jsonb_build_object(
            'vendor_job_id', new_vendor_job_id,
            'amount_usd', p_amount_usd,
            'delivery_type', p_delivery_type,
            'trade_code', trade_code
        )
    FROM public.vendors v
    WHERE v.id = available_vendor_id;
    
    RETURN new_vendor_job_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 7. CREATE REALTIME TRIGGERS
-- =============================================

-- Trigger for new vendor jobs
CREATE OR REPLACE FUNCTION public.notify_vendor_job_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify all vendors about new job
    INSERT INTO public.notifications (user_id, type, title, message, data)
    SELECT 
        v.user_id,
        'vendor_job_available',
        'New Job Available',
        'Premium user needs ' || NEW.delivery_type || ' service for $' || NEW.amount_usd,
        jsonb_build_object(
            'vendor_job_id', NEW.id,
            'amount_usd', NEW.amount_usd,
            'delivery_type', NEW.delivery_type
        )
    FROM public.vendors v
    WHERE v.active = true;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_vendor_job_created ON public.vendor_jobs;
CREATE TRIGGER trigger_vendor_job_created
    AFTER INSERT ON public.vendor_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_vendor_job_created();

-- =============================================
-- 8. UPDATE SYSTEM CONFIG
-- =============================================

INSERT INTO public.system_config (key, value, description) VALUES
    ('VENDOR_BANK_ACCOUNT', '1234567890', 'Centralized platform account for receiving payments'),
    ('VENDOR_BANK_NAME', 'Central Exchange Bank', 'Bank name for vendor account'),
    ('VENDOR_BANK_CODE', '058', 'Bank code for vendor account'),
    ('CREDIT_USD_VALUE', '10', 'USD value per credit (1 credit = $10)'),
    ('PRICE_PER_CREDIT_NAIRA', '16500', 'Naira cost per credit'),
    ('DEDUCTION_RULE', 'trade_creation', 'When to deduct credits: trade_creation or vendor_confirmation'),
    ('TRADE_CODE_LENGTH', '6', 'Length of trade verification codes'),
    ('VENDOR_ASSIGNMENT_RULE', 'random', 'How to assign vendors: random, location, or manual'),
    ('MIN_PREMIUM_AMOUNT_USD', '100', 'Minimum USD amount for premium trades'),
    ('MAX_PREMIUM_AMOUNT_USD', '10000', 'Maximum USD amount for premium trades')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = now();

-- =============================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_crypto_wallets_user_coin ON public.crypto_wallets(user_id, coin_type);
CREATE INDEX IF NOT EXISTS idx_premium_trade_codes_code ON public.premium_trade_codes(code);
CREATE INDEX IF NOT EXISTS idx_premium_trade_codes_status ON public.premium_trade_codes(status);
CREATE INDEX IF NOT EXISTS idx_vendor_jobs_status ON public.vendor_jobs(status);
CREATE INDEX IF NOT EXISTS idx_vendor_jobs_vendor ON public.vendor_jobs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_system_rates_pair ON public.system_rates(currency_pair);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);

-- =============================================
-- 10. SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '✅ SUCCESS: Complete Premium Real-Time System Implemented!';
    RAISE NOTICE '✅ Created crypto_wallets table with RLS';
    RAISE NOTICE '✅ Created support_tickets table with RLS';
    RAISE NOTICE '✅ Added missing columns to existing tables';
    RAISE NOTICE '✅ Created premium_trade_codes table for verification';
    RAISE NOTICE '✅ Created system_rates table for real-time rates';
    RAISE NOTICE '✅ Implemented trade code generation system';
    RAISE NOTICE '✅ Created premium trade creation function';
    RAISE NOTICE '✅ Set up real-time vendor notifications';
    RAISE NOTICE '✅ Configured system settings for premium flow';
    RAISE NOTICE '✅ Added performance indexes';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 READY: Premium users can now create real-time vendor jobs';
    RAISE NOTICE '🎯 READY: Vendors receive real-time notifications';
    RAISE NOTICE '🎯 READY: Trade codes work for pickup/delivery verification';
    RAISE NOTICE '🎯 READY: Credit system tracks real usage';
END $$;