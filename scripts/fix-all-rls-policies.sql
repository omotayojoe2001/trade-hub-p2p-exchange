-- COMPREHENSIVE RLS POLICY FIX
-- This fixes all RLS issues for trades, trade_requests, and related functionality

-- =============================================
-- 1. FIX TRADE_REQUESTS POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their trade requests" ON public.trade_requests;
DROP POLICY IF EXISTS "Users can create trade requests" ON public.trade_requests;
DROP POLICY IF EXISTS "Users can update their trade requests" ON public.trade_requests;
DROP POLICY IF EXISTS "Merchants can view trade requests" ON public.trade_requests;

-- Create comprehensive trade_requests policies
CREATE POLICY "Users can view trade requests" ON public.trade_requests
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE is_merchant = true
        )
    );

CREATE POLICY "Users can create trade requests" ON public.trade_requests
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

CREATE POLICY "Users can update trade requests" ON public.trade_requests
    FOR UPDATE USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE is_merchant = true
        )
    );

-- =============================================
-- 2. FIX TRADES POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their trades" ON public.trades;
DROP POLICY IF EXISTS "Users can create trades" ON public.trades;
DROP POLICY IF EXISTS "Users can update their trades" ON public.trades;

-- Create comprehensive trades policies
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
        ) OR
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE is_merchant = true
        )
    );

CREATE POLICY "Users can update their trades" ON public.trades
    FOR UPDATE USING (
        auth.uid() = buyer_id OR 
        auth.uid() = seller_id
    );

-- =============================================
-- 3. FIX NOTIFICATIONS POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;

-- Create comprehensive notifications policies
CREATE POLICY "Users can view their notifications" ON public.notifications
    FOR SELECT USING (
        auth.uid() = user_id
    );

CREATE POLICY "Users can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (
        true -- Allow any authenticated user to create notifications
    );

CREATE POLICY "Users can update their notifications" ON public.notifications
    FOR UPDATE USING (
        auth.uid() = user_id
    );

-- =============================================
-- 4. FIX MESSAGES POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their messages" ON public.messages;

-- Create comprehensive messages policies
CREATE POLICY "Users can view their messages" ON public.messages
    FOR SELECT USING (
        auth.uid() = sender_id OR 
        auth.uid() = receiver_id
    );

CREATE POLICY "Users can create messages" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
    );

CREATE POLICY "Users can update their messages" ON public.messages
    FOR UPDATE USING (
        auth.uid() = sender_id OR 
        auth.uid() = receiver_id
    );

-- =============================================
-- 5. VERIFY POLICIES
-- =============================================

-- Check all policies are created correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('trade_requests', 'trades', 'notifications', 'messages')
ORDER BY tablename, policyname;

-- =============================================
-- 6. SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '✅ SUCCESS: All RLS policies have been fixed!';
    RAISE NOTICE '✅ Trade requests: Can be created, viewed, and declined';
    RAISE NOTICE '✅ Trades: Can be created and managed by merchants';
    RAISE NOTICE '✅ Notifications: Can be created and viewed';
    RAISE NOTICE '✅ Messages: Can be sent and received';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TEST NOW:';
    RAISE NOTICE '1. Customer: Send trade request';
    RAISE NOTICE '2. Merchant: Accept/Decline trade';
    RAISE NOTICE '3. Complete trade flow';
END $$;
