-- VENDOR SYSTEM AND CREDITS MIGRATION (FIXED VERSION)
-- Implements vendor role, cash pickup/delivery, and credits system
-- This version avoids modifying auth.users table

-- =============================================
-- 1. ADD VENDOR ROLE AND CREDITS TO PROFILES ONLY
-- =============================================

-- Add role enum type
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'vendor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add vendor-related columns to profiles table only (cannot modify auth.users)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits_balance INTEGER DEFAULT 0;

-- =============================================
-- 2. CREATE VENDORS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    bank_account TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    bank_code TEXT,
    phone TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    working_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00", "timezone": "Africa/Lagos"}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- 3. CREATE VENDOR_JOBS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.vendor_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
    premium_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    trade_id UUID REFERENCES public.trades(id) ON DELETE SET NULL,
    amount_usd DECIMAL(20,2) NOT NULL,
    amount_naira_received DECIMAL(20,2),
    fee_naira DECIMAL(20,2) DEFAULT 0,
    delivery_type TEXT NOT NULL CHECK (delivery_type IN ('pickup', 'delivery', 'naira_to_usd')),
    address_json JSONB,
    status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'payment_received', 'awaiting_handoff', 'completed', 'cancelled', 'dispute')),
    verification_code TEXT,
    verification_code_hash TEXT,
    code_generated_at TIMESTAMP WITH TIME ZONE,
    code_expires_at TIMESTAMP WITH TIME ZONE,
    payment_received_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    bank_tx_reference TEXT,
    payment_proof_url TEXT,
    credits_required INTEGER NOT NULL DEFAULT 0,
    credits_deducted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- 4. CREATE CREDIT_PURCHASE_TRANSACTIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.credit_purchase_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credits_amount INTEGER NOT NULL,
    price_paid_naira DECIMAL(20,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_proof_url TEXT,
    payment_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- 5. CREATE VENDOR_ACTIVITY_LOG TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.vendor_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.vendor_jobs(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- 6. ADD VENDOR REFERENCE TO TRADES TABLE
-- =============================================

ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS assigned_vendor_job_id UUID REFERENCES public.vendor_jobs(id);

-- =============================================
-- 7. CREATE SYSTEM CONFIGURATION TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default configuration values
INSERT INTO public.system_config (key, value, description) VALUES
    ('CREDIT_USD_VALUE', '10', 'USD value represented by 1 credit'),
    ('CREDIT_PRICE_NGN', '1500', 'Price per credit in Naira'),
    ('CREDITS_DEDUCTION_POLICY', 'on_vendor_confirm', 'When to deduct credits: on_vendor_confirm or on_trade_create'),
    ('POINTS_ROUNDING', 'ceil', 'Rounding policy for credit calculations'),
    ('VENDOR_AUTO_ASSIGN_RADIUS_KM', '10', 'Auto-assign radius in kilometers'),
    ('DELIVERY_CODE_LENGTH', '6', 'Length of verification codes'),
    ('VENDOR_BANK_ACCOUNT', '1234567890', 'Default vendor bank account'),
    ('VENDOR_BANK_NAME', 'First Bank', 'Default vendor bank name'),
    ('VENDOR_BANK_CODE', '011', 'Default vendor bank code')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- 8. ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_purchase_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 9. CREATE RLS POLICIES
-- =============================================

-- Vendors policies
DROP POLICY IF EXISTS "vendors_select_policy" ON public.vendors;
CREATE POLICY "vendors_select_policy" ON public.vendors 
FOR SELECT USING (true); -- Anyone can view vendor info

DROP POLICY IF EXISTS "vendors_modify_policy" ON public.vendors;
CREATE POLICY "vendors_modify_policy" ON public.vendors 
FOR ALL USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'
));

-- Vendor jobs policies
DROP POLICY IF EXISTS "vendor_jobs_select_policy" ON public.vendor_jobs;
CREATE POLICY "vendor_jobs_select_policy" ON public.vendor_jobs 
FOR SELECT USING (
    auth.uid() = premium_user_id OR 
    auth.uid() = buyer_id OR
    EXISTS (SELECT 1 FROM public.vendors WHERE user_id = auth.uid() AND id = vendor_id) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "vendor_jobs_modify_policy" ON public.vendor_jobs;
CREATE POLICY "vendor_jobs_modify_policy" ON public.vendor_jobs 
FOR ALL USING (
    auth.uid() = premium_user_id OR
    EXISTS (SELECT 1 FROM public.vendors WHERE user_id = auth.uid() AND id = vendor_id) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Credit purchase transactions policies
DROP POLICY IF EXISTS "credit_transactions_policy" ON public.credit_purchase_transactions;
CREATE POLICY "credit_transactions_policy" ON public.credit_purchase_transactions 
FOR ALL USING (auth.uid() = user_id);

-- Vendor activity log policies
DROP POLICY IF EXISTS "vendor_activity_log_policy" ON public.vendor_activity_log;
CREATE POLICY "vendor_activity_log_policy" ON public.vendor_activity_log 
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.vendors WHERE user_id = auth.uid() AND id = vendor_id) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- System config policies
DROP POLICY IF EXISTS "system_config_select_policy" ON public.system_config;
CREATE POLICY "system_config_select_policy" ON public.system_config 
FOR SELECT USING (true); -- Anyone can read config

DROP POLICY IF EXISTS "system_config_modify_policy" ON public.system_config;
CREATE POLICY "system_config_modify_policy" ON public.system_config 
FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'
));

-- =============================================
-- 10. CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON public.vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_active ON public.vendors(active);
CREATE INDEX IF NOT EXISTS idx_vendors_location ON public.vendors(location_lat, location_lng);

CREATE INDEX IF NOT EXISTS idx_vendor_jobs_vendor_id ON public.vendor_jobs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_jobs_premium_user_id ON public.vendor_jobs(premium_user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_jobs_buyer_id ON public.vendor_jobs(buyer_id);
CREATE INDEX IF NOT EXISTS idx_vendor_jobs_trade_id ON public.vendor_jobs(trade_id);
CREATE INDEX IF NOT EXISTS idx_vendor_jobs_status ON public.vendor_jobs(status);
CREATE INDEX IF NOT EXISTS idx_vendor_jobs_delivery_type ON public.vendor_jobs(delivery_type);
CREATE INDEX IF NOT EXISTS idx_vendor_jobs_created_at ON public.vendor_jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_purchase_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_status ON public.credit_purchase_transactions(status);

CREATE INDEX IF NOT EXISTS idx_vendor_activity_vendor_id ON public.vendor_activity_log(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_activity_job_id ON public.vendor_activity_log(job_id);
CREATE INDEX IF NOT EXISTS idx_vendor_activity_created_at ON public.vendor_activity_log(created_at DESC);

-- Add index on profiles role column
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- =============================================
-- 11. CREATE UPDATE TRIGGERS
-- =============================================

-- Update triggers for timestamp management
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS update_vendors_updated_at ON public.vendors;
        CREATE TRIGGER update_vendors_updated_at
            BEFORE UPDATE ON public.vendors
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
            
        DROP TRIGGER IF EXISTS update_vendor_jobs_updated_at ON public.vendor_jobs;
        CREATE TRIGGER update_vendor_jobs_updated_at
            BEFORE UPDATE ON public.vendor_jobs
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
            
        DROP TRIGGER IF EXISTS update_credit_transactions_updated_at ON public.credit_purchase_transactions;
        CREATE TRIGGER update_credit_transactions_updated_at
            BEFORE UPDATE ON public.credit_purchase_transactions
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- =============================================
-- 12. CREATE HELPER FUNCTIONS
-- =============================================

-- Function to create a vendor user and profile
CREATE OR REPLACE FUNCTION create_vendor_user(
    p_email TEXT,
    p_password TEXT,
    p_display_name TEXT,
    p_phone TEXT,
    p_bank_account TEXT,
    p_bank_name TEXT,
    p_bank_code TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
    new_vendor_id UUID;
BEGIN
    -- This function should be called by admin users only
    -- In a real implementation, you'd create the user via Supabase Auth API
    -- For now, we'll assume the user already exists and just create the vendor profile
    
    -- Get user ID (assuming user exists)
    SELECT id INTO new_user_id FROM auth.users WHERE email = p_email;
    
    IF new_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found. Create user first via Supabase Auth.', p_email;
    END IF;
    
    -- Update profile to vendor role
    UPDATE public.profiles 
    SET role = 'vendor', display_name = p_display_name, phone_number = p_phone
    WHERE user_id = new_user_id;
    
    -- Create vendor profile
    INSERT INTO public.vendors (
        user_id, display_name, phone, bank_account, bank_name, bank_code
    ) VALUES (
        new_user_id, p_display_name, p_phone, p_bank_account, p_bank_name, p_bank_code
    ) RETURNING id INTO new_vendor_id;
    
    RETURN new_vendor_id;
END;
$$;

-- =============================================
-- 13. SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '✅ SUCCESS: Vendor system and credits implemented (FIXED VERSION)!';
    RAISE NOTICE '✅ Added vendor role and credits to profiles table only';
    RAISE NOTICE '✅ Created vendors table for vendor profiles';
    RAISE NOTICE '✅ Created vendor_jobs table for pickup/delivery jobs';
    RAISE NOTICE '✅ Created credit system with purchase transactions';
    RAISE NOTICE '✅ Created vendor activity logging';
    RAISE NOTICE '✅ Added system configuration management';
    RAISE NOTICE '✅ Set up proper RLS policies and indexes';
    RAISE NOTICE '✅ Added helper function for creating vendor users';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 NEXT STEPS:';
    RAISE NOTICE '1. Run the original database fix script first';
    RAISE NOTICE '2. Then run this fixed vendor system migration';
    RAISE NOTICE '3. Create vendor users via Supabase Auth Dashboard';
    RAISE NOTICE '4. Use create_vendor_user() function to set up vendor profiles';
    RAISE NOTICE '5. Test vendor registration and job flows';
END $$;
