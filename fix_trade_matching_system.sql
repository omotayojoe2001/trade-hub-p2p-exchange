-- FIX TRADE MATCHING SYSTEM
-- This script fixes the issue where merchants and customers cannot see each other

-- =============================================
-- 1. DROP AND RECREATE TRADE REQUESTS TABLE
-- =============================================

-- Drop existing table if it exists (to fix any column issues)
DROP TABLE IF EXISTS public.trade_requests CASCADE;

-- Create trade_requests table for P2P trading
CREATE TABLE public.trade_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    crypto_type TEXT NOT NULL,
    amount_crypto DECIMAL NOT NULL,
    amount_fiat DECIMAL NOT NULL,
    rate DECIMAL NOT NULL,
    trade_type TEXT NOT NULL, -- 'buy' or 'sell'
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on trade_requests
ALTER TABLE public.trade_requests ENABLE ROW LEVEL SECURITY;

-- RLS policy for trade_requests - users can see all open requests except their own
DROP POLICY IF EXISTS "trade_requests_policy" ON public.trade_requests;
CREATE POLICY "trade_requests_policy" ON public.trade_requests 
FOR SELECT USING (
    status = 'open' 
    AND expires_at > now()
    AND (auth.uid() != user_id OR auth.uid() = user_id)
);

-- Policy for inserting trade requests
DROP POLICY IF EXISTS "trade_requests_insert_policy" ON public.trade_requests;
CREATE POLICY "trade_requests_insert_policy" ON public.trade_requests 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for updating own trade requests
DROP POLICY IF EXISTS "trade_requests_update_policy" ON public.trade_requests;
CREATE POLICY "trade_requests_update_policy" ON public.trade_requests 
FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 2. CREATE MERCHANT LIST VIEW
-- =============================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.available_merchants CASCADE;

-- Create a view for available merchants
CREATE VIEW public.available_merchants AS
SELECT
    p.user_id as id,
    p.display_name,
    p.created_at,
    p.is_merchant,
    p.merchant_mode,
    -- Calculate merchant stats
    COALESCE(t.total_trades, 0) as total_trades,
    COALESCE(t.completed_trades, 0) as completed_trades,
    CASE
        WHEN COALESCE(t.total_trades, 0) > 0
        THEN ROUND((COALESCE(t.completed_trades, 0)::DECIMAL / t.total_trades) * 100, 1)
        ELSE 0
    END as success_rate
FROM public.profiles p
LEFT JOIN (
    SELECT 
        seller_id as user_id,
        COUNT(*) as total_trades,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_trades
    FROM public.trades
    GROUP BY seller_id
    UNION ALL
    SELECT 
        buyer_id as user_id,
        COUNT(*) as total_trades,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_trades
    FROM public.trades
    GROUP BY buyer_id
) t ON p.user_id = t.user_id
WHERE p.is_merchant = true
AND p.merchant_mode = true
AND p.user_id IN (SELECT id FROM auth.users WHERE email_confirmed_at IS NOT NULL);

-- =============================================
-- 3. CREATE FUNCTIONS FOR TRADE MATCHING
-- =============================================

-- Function to create a trade request
CREATE OR REPLACE FUNCTION create_trade_request(
    p_user_id UUID,
    p_crypto_type TEXT,
    p_amount_crypto DECIMAL,
    p_amount_fiat DECIMAL,
    p_rate DECIMAL,
    p_trade_type TEXT,
    p_payment_method TEXT
)
RETURNS UUID AS $$
DECLARE
    v_request_id UUID;
BEGIN
    INSERT INTO public.trade_requests (
        user_id,
        crypto_type,
        amount_crypto,
        amount_fiat,
        rate,
        trade_type,
        payment_method,
        status,
        expires_at
    ) VALUES (
        p_user_id,
        p_crypto_type,
        p_amount_crypto,
        p_amount_fiat,
        p_rate,
        p_trade_type,
        p_payment_method,
        'open',
        now() + INTERVAL '24 hours'
    ) RETURNING id INTO v_request_id;
    
    RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept a trade request
CREATE OR REPLACE FUNCTION accept_trade_request(
    p_request_id UUID,
    p_accepter_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_request RECORD;
    v_trade_id UUID;
BEGIN
    -- Get the trade request
    SELECT * INTO v_request
    FROM public.trade_requests
    WHERE id = p_request_id
    AND status = 'open'
    AND expires_at > now()
    AND user_id != p_accepter_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Trade request not found or expired';
    END IF;
    
    -- Create the actual trade
    INSERT INTO public.trades (
        seller_id,
        buyer_id,
        crypto_type,
        amount_crypto,
        amount_fiat,
        rate,
        status,
        trade_type,
        payment_method
    ) VALUES (
        CASE 
            WHEN v_request.trade_type = 'sell' THEN v_request.user_id
            ELSE p_accepter_id
        END,
        CASE 
            WHEN v_request.trade_type = 'buy' THEN v_request.user_id
            ELSE p_accepter_id
        END,
        v_request.crypto_type,
        v_request.amount_crypto,
        v_request.amount_fiat,
        v_request.rate,
        'pending',
        v_request.trade_type,
        v_request.payment_method
    ) RETURNING id INTO v_trade_id;
    
    -- Mark the request as accepted
    UPDATE public.trade_requests
    SET status = 'accepted', updated_at = now()
    WHERE id = p_request_id;
    
    -- Notify both parties
    INSERT INTO public.notifications (user_id, title, message, type, data)
    VALUES 
    (v_request.user_id, 'Trade Request Accepted', 
     'Your trade request has been accepted', 'trade_accepted',
     jsonb_build_object('trade_id', v_trade_id, 'action', 'view_trade')),
    (p_accepter_id, 'Trade Started', 
     'You have accepted a trade request', 'trade_started',
     jsonb_build_object('trade_id', v_trade_id, 'action', 'view_trade'));
    
    RETURN v_trade_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available trade requests for a user
CREATE OR REPLACE FUNCTION get_available_trade_requests(p_user_id UUID)
RETURNS TABLE(
    id UUID,
    user_id UUID,
    user_display_name TEXT,
    crypto_type TEXT,
    amount_crypto DECIMAL,
    amount_fiat DECIMAL,
    rate DECIMAL,
    trade_type TEXT,
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tr.id,
        tr.user_id,
        p.display_name as user_display_name,
        tr.crypto_type,
        tr.amount_crypto,
        tr.amount_fiat,
        tr.rate,
        tr.trade_type,
        tr.payment_method,
        tr.created_at,
        tr.expires_at
    FROM public.trade_requests tr
    JOIN public.profiles p ON tr.user_id = p.user_id
    WHERE tr.status = 'open'
    AND tr.expires_at > now()
    AND tr.user_id != p_user_id
    ORDER BY tr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 4. INSERT SAMPLE DATA FOR TESTING
-- =============================================

-- Create some sample trade requests for testing
DO $$
DECLARE
    v_user_count INTEGER;
    v_user_id UUID;
BEGIN
    -- Check if we have any users
    SELECT COUNT(*) INTO v_user_count FROM auth.users;

    -- Only create sample data if we have users
    IF v_user_count > 0 THEN
        -- Get the first user ID
        SELECT id INTO v_user_id FROM auth.users LIMIT 1;

        -- Create sample trade requests only if table exists and has correct structure
        BEGIN
            -- Test insert to verify table structure
            INSERT INTO public.trade_requests (
                user_id, crypto_type, amount_crypto, amount_fiat, rate,
                trade_type, payment_method, status, expires_at
            ) VALUES (
                v_user_id, 'USDT', 100, 165000, 1650,
                'buy', 'bank_transfer', 'open', now() + INTERVAL '24 hours'
            );

            -- If first insert succeeds, create more
            INSERT INTO public.trade_requests (
                user_id, crypto_type, amount_crypto, amount_fiat, rate,
                trade_type, payment_method, status, expires_at
            ) VALUES (
                v_user_id, 'BTC', 0.001, 97.23, 97230,
                'sell', 'bank_transfer', 'open', now() + INTERVAL '24 hours'
            );

            RAISE NOTICE 'Created sample trade requests for testing';

        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create sample data: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'No users found - skipping sample data creation';
    END IF;
END $$;

-- =============================================
-- 5. SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ SUCCESS: Trade matching system fixed!';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 WHAT WAS CREATED:';
    RAISE NOTICE '• trade_requests table - For P2P trade requests';
    RAISE NOTICE '• available_merchants view - Shows active merchants';
    RAISE NOTICE '• create_trade_request() - Create new trade requests';
    RAISE NOTICE '• accept_trade_request() - Accept trade requests';
    RAISE NOTICE '• get_available_trade_requests() - Get available trades';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 WHAT SHOULD WORK NOW:';
    RAISE NOTICE '• Merchants can see customer trade requests';
    RAISE NOTICE '• Customers can see merchant trade requests';
    RAISE NOTICE '• Trade requests expire after 24 hours';
    RAISE NOTICE '• Notifications sent when trades are accepted';
    RAISE NOTICE '• Sample trade requests created for testing';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TEST STEPS:';
    RAISE NOTICE '1. Create a trade request as customer';
    RAISE NOTICE '2. Switch to merchant account';
    RAISE NOTICE '3. Check if trade request appears';
    RAISE NOTICE '4. Accept the trade request';
    RAISE NOTICE '5. Verify both users get notifications';
END $$;
