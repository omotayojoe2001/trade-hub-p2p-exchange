-- EMERGENCY: Fix RLS policies that are exposing all user data
-- First drop all existing policies to avoid conflicts

-- Drop all existing policies for profiles
DROP POLICY IF EXISTS "Users can view other profiles for trading" ON public.profiles;
DROP POLICY IF EXISTS "Users can view merchant profiles during matching" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_policy" ON public.profiles;

-- Create new restrictive policies for profiles
CREATE POLICY "users_own_profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "view_active_merchants_only" ON public.profiles
    FOR SELECT USING (
        is_merchant = true AND merchant_mode = true AND auth.uid() != user_id
    );

-- Drop all existing policies for trades
DROP POLICY IF EXISTS "Users can view their own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can only view their own trades" ON public.trades;
DROP POLICY IF EXISTS "trades_policy" ON public.trades;

-- Create strict trade policy - users can ONLY see their own trades
CREATE POLICY "users_own_trades_only" ON public.trades
    FOR SELECT USING (
        auth.uid() = buyer_id OR auth.uid() = seller_id
    );

-- Drop all existing policies for trade_requests
DROP POLICY IF EXISTS "trade_requests_select_policy" ON public.trade_requests;
DROP POLICY IF EXISTS "Users can view open trade requests (not their own)" ON public.trade_requests;

-- Create strict trade request policy
CREATE POLICY "trade_requests_strict_access" ON public.trade_requests
    FOR SELECT USING (
        -- Users can see their own trade requests
        auth.uid() = user_id OR
        -- Users can see open trade requests from others (for matching)
        (status = 'open' AND expires_at > now() AND auth.uid() != user_id)
    );

-- Verify policies
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('profiles', 'trades', 'trade_requests')
ORDER BY tablename, policyname;