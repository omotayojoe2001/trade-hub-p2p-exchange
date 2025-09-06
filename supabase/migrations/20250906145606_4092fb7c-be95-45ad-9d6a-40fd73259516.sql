-- EMERGENCY: Fix RLS policies that are exposing all user data
-- The issue is with the "Users can view other profiles for trading" policy which allows viewing ALL profiles
-- This is why users can see all trades and trade requests

-- Drop the overly permissive profile policy
DROP POLICY IF EXISTS "Users can view other profiles for trading" ON public.profiles;

-- Create a more restrictive policy for viewing other profiles (only for merchants during matching)
CREATE POLICY "Users can view merchant profiles during matching" ON public.profiles
    FOR SELECT USING (
        -- Users can see their own profile
        auth.uid() = user_id OR 
        -- Users can see merchant profiles when they're active merchants
        (is_merchant = true AND merchant_mode = true)
    );

-- Fix trades table - it should NEVER show other users' trades
DROP POLICY IF EXISTS "Users can view their own trades" ON public.trades;
DROP POLICY IF EXISTS "trades_policy" ON public.trades;

CREATE POLICY "Users can only view their own trades" ON public.trades
    FOR SELECT USING (
        auth.uid() = buyer_id OR auth.uid() = seller_id
    );

-- Fix trade_requests table - should only show open requests that aren't the user's own
DROP POLICY IF EXISTS "trade_requests_select_policy" ON public.trade_requests;

CREATE POLICY "Users can view open trade requests (not their own)" ON public.trade_requests
    FOR SELECT USING (
        -- Users can see their own trade requests
        auth.uid() = user_id OR
        -- Users can see open trade requests from others (for matching)
        (status = 'open' AND expires_at > now() AND auth.uid() != user_id)
    );

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('profiles', 'trades', 'trade_requests')
ORDER BY tablename, policyname;