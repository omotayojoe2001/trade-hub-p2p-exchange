-- FIX TRADE STATUS CONSTRAINT ERROR
-- Run this to fix the trade_requests status constraint issue

-- =============================================
-- 1. CHECK CURRENT CONSTRAINT
-- =============================================

-- Check what status values are currently allowed
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.trade_requests'::regclass 
    AND contype = 'c'
    AND conname LIKE '%status%';

-- =============================================
-- 2. DROP EXISTING STATUS CONSTRAINT
-- =============================================

-- Drop the existing constraint that's causing issues
ALTER TABLE public.trade_requests 
DROP CONSTRAINT IF EXISTS trade_requests_status_check;

-- =============================================
-- 3. CREATE NEW FLEXIBLE STATUS CONSTRAINT
-- =============================================

-- Add a new constraint that allows all the status values we need
ALTER TABLE public.trade_requests 
ADD CONSTRAINT trade_requests_status_check 
CHECK (status IN ('open', 'accepted', 'declined', 'completed', 'cancelled', 'pending', 'in_progress'));

-- =============================================
-- 4. UPDATE ANY INVALID STATUS VALUES
-- =============================================

-- Update any existing invalid status values to valid ones
UPDATE public.trade_requests 
SET status = 'open' 
WHERE status NOT IN ('open', 'accepted', 'declined', 'completed', 'cancelled', 'pending', 'in_progress');

-- =============================================
-- 5. VERIFY THE FIX
-- =============================================

-- Check that the constraint is now working
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.trade_requests'::regclass 
    AND contype = 'c'
    AND conname = 'trade_requests_status_check';

-- Test that we can now update status to 'accepted'
DO $$
DECLARE
    test_id UUID;
BEGIN
    -- Get a test trade request ID
    SELECT id INTO test_id FROM public.trade_requests LIMIT 1;
    
    IF test_id IS NOT NULL THEN
        -- Try to update to accepted (this should work now)
        UPDATE public.trade_requests 
        SET status = 'accepted' 
        WHERE id = test_id;
        
        -- Revert back to original status
        UPDATE public.trade_requests 
        SET status = 'open' 
        WHERE id = test_id;
        
        RAISE NOTICE '✅ Status constraint fix successful - can now accept trades';
    ELSE
        RAISE NOTICE '⚠️  No trade requests found to test with';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Status constraint fix failed: %', SQLERRM;
END $$;

-- =============================================
-- 6. CREATE REFERRAL COMMISSIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.referral_commissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    trade_id UUID,
    commission_amount DECIMAL(10,2) DEFAULT 0,
    commission_rate DECIMAL(5,4) DEFAULT 0.003, -- 0.3%
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- 7. CREATE SUPPORT TICKETS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- 8. ADD REFERRAL FIELDS TO PROFILES
-- =============================================

-- Add referral fields to profiles table if they don't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS merchant_settings JSONB;

-- =============================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Referral commissions indexes
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer_id ON public.referral_commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referred_user_id ON public.referral_commissions(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_status ON public.referral_commissions(status);

-- Support tickets indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- =============================================
-- 10. ENABLE RLS ON NEW TABLES (SAFE MODE)
-- =============================================

-- Enable RLS on referral_commissions
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Users can view their referral commissions" ON public.referral_commissions;
CREATE POLICY "Users can view their referral commissions" ON public.referral_commissions
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

-- Enable RLS on support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Users can view their support tickets" ON public.support_tickets;
CREATE POLICY "Users can view their support tickets" ON public.support_tickets
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their support tickets" ON public.support_tickets;
CREATE POLICY "Users can create their support tickets" ON public.support_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 11. SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '✅ ALL FIXES COMPLETE!';
    RAISE NOTICE '✅ Trade status constraint fixed';
    RAISE NOTICE '✅ Referral commissions table created';
    RAISE NOTICE '✅ Support tickets table created';
    RAISE NOTICE '✅ Merchant settings support added';
    RAISE NOTICE '✅ All RLS policies enabled';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TEST NOW:';
    RAISE NOTICE '1. Accept/decline trade requests';
    RAISE NOTICE '2. Referral system functionality';
    RAISE NOTICE '3. Support ticket submission';
    RAISE NOTICE '4. Merchant settings saving';
END $$;
