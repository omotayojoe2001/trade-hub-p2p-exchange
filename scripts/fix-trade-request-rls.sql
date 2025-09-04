-- Fix RLS policies for trade requests to allow merchant acceptance

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all open trade requests" ON public.trade_requests;
DROP POLICY IF EXISTS "Users can insert their own trade requests" ON public.trade_requests;
DROP POLICY IF EXISTS "Users can update their own trade requests" ON public.trade_requests;

-- Create new policies that allow merchants to accept trade requests

-- 1. Allow viewing open trade requests or own trade requests
CREATE POLICY "Users can view trade requests" ON public.trade_requests
    FOR SELECT USING (
        status = 'open' OR 
        auth.uid() = user_id
    );

-- 2. Allow users to create their own trade requests
CREATE POLICY "Users can create trade requests" ON public.trade_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Allow users to update their own trade requests OR merchants to accept any open trade request
CREATE POLICY "Users can update trade requests" ON public.trade_requests
    FOR UPDATE USING (
        auth.uid() = user_id OR  -- User can update their own
        (status = 'open' AND EXISTS (  -- Merchants can accept open requests
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND is_merchant = true
        ))
    );

-- Also fix trades table RLS policies
DROP POLICY IF EXISTS "Users can view their own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can insert trades" ON public.trades;
DROP POLICY IF EXISTS "Users can update their own trades" ON public.trades;

-- Create trades policies
CREATE POLICY "Users can view their trades" ON public.trades
    FOR SELECT USING (
        auth.uid() = buyer_id OR 
        auth.uid() = seller_id
    );

CREATE POLICY "Users can create trades" ON public.trades
    FOR INSERT WITH CHECK (
        auth.uid() = buyer_id OR 
        auth.uid() = seller_id
    );

CREATE POLICY "Users can update their trades" ON public.trades
    FOR UPDATE USING (
        auth.uid() = buyer_id OR 
        auth.uid() = seller_id
    );

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('trade_requests', 'trades')
ORDER BY tablename, policyname;
