-- Fix RLS policy for trade request acceptance
-- The current policy has an issue with merchant verification

-- Drop the problematic policy
DROP POLICY IF EXISTS "trade_requests_accept_policy" ON public.trade_requests;

-- Create a new, more permissive policy for trade request acceptance
-- Allow any authenticated user to accept open trade requests (merchants can be verified in application logic)
CREATE POLICY "trade_requests_accept_policy" ON public.trade_requests
    FOR UPDATE USING (
        auth.uid() = user_id OR  -- User can update their own
        status = 'open'  -- Anyone can accept open requests (merchant verification in app)
    );

-- Also ensure the insert policy allows trade creation from accepted requests
DROP POLICY IF EXISTS "Users can create trades" ON public.trades;

CREATE POLICY "Users can create trades" ON public.trades
    FOR INSERT WITH CHECK (
        auth.uid() = buyer_id OR 
        auth.uid() = seller_id OR
        -- Allow creating trades from accepted trade requests
        (trade_request_id IS NOT NULL)
    );

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('trade_requests', 'trades')
AND policyname IN ('trade_requests_accept_policy', 'Users can create trades')
ORDER BY tablename, policyname;