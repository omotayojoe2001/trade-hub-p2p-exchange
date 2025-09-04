-- URGENT: Fix RLS policies for trades table

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their trades" ON public.trades;
DROP POLICY IF EXISTS "Users can create trades" ON public.trades;
DROP POLICY IF EXISTS "Users can update their trades" ON public.trades;

-- Create new policies that allow trade creation
CREATE POLICY "Users can view their trades" ON public.trades
    FOR SELECT USING (
        auth.uid() = buyer_id OR 
        auth.uid() = seller_id
    );

CREATE POLICY "Users can create trades" ON public.trades
    FOR INSERT WITH CHECK (
        auth.uid() = buyer_id OR 
        auth.uid() = seller_id OR
        auth.uid() IN (
            SELECT user_id FROM trade_requests 
            WHERE id = trade_request_id
        )
    );

CREATE POLICY "Users can update their trades" ON public.trades
    FOR UPDATE USING (
        auth.uid() = buyer_id OR 
        auth.uid() = seller_id
    );

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'trades'
ORDER BY policyname;
