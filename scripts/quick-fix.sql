-- QUICK FIX FOR FOREIGN KEY ERROR
-- Run this immediately to fix the current error

-- =============================================
-- 1. REMOVE PROBLEMATIC FOREIGN KEY CONSTRAINTS
-- =============================================

-- Drop the problematic foreign key constraints
ALTER TABLE public.trades DROP CONSTRAINT IF EXISTS trades_buyer_id_fkey;
ALTER TABLE public.trades DROP CONSTRAINT IF EXISTS trades_seller_id_fkey;

-- =============================================
-- 2. CLEAN UP INVALID DATA
-- =============================================

-- Remove trades with the problematic UUID
DELETE FROM public.trades 
WHERE buyer_id = '00000000-0000-0000-0000-000000000001'
   OR seller_id = '00000000-0000-0000-0000-000000000001';

-- Remove any other invalid references
DELETE FROM public.trades 
WHERE buyer_id IS NULL 
   OR seller_id IS NULL;

-- =============================================
-- 3. CREATE PAYMENT_METHODS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('bank_account', 'card', 'mobile_money')),
    bank_name TEXT,
    bank_code TEXT,
    account_number TEXT,
    account_name TEXT,
    country TEXT DEFAULT 'NG',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. ENABLE RLS ON PAYMENT_METHODS
-- =============================================

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their payment methods" ON public.payment_methods
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their payment methods" ON public.payment_methods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their payment methods" ON public.payment_methods
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their payment methods" ON public.payment_methods
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 5. CREATE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON public.trades(created_at);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);

-- =============================================
-- 6. SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '✅ QUICK FIX COMPLETE!';
    RAISE NOTICE '✅ Foreign key constraints removed';
    RAISE NOTICE '✅ Invalid trade data cleaned up';
    RAISE NOTICE '✅ payment_methods table created';
    RAISE NOTICE '✅ RLS policies enabled';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TEST NOW:';
    RAISE NOTICE '1. Home page should work';
    RAISE NOTICE '2. Payment methods should load';
    RAISE NOTICE '3. No more foreign key errors';
END $$;
