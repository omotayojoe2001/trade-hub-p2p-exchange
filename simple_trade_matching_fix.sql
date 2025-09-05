-- SIMPLE TRADE MATCHING FIX
-- This is a minimal script to fix trade matching issues

-- =============================================
-- 1. CREATE BASIC TRADE REQUESTS TABLE
-- =============================================

-- Drop and recreate trade_requests table
DROP TABLE IF EXISTS public.trade_requests CASCADE;

CREATE TABLE public.trade_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    crypto_type TEXT NOT NULL,
    amount_crypto DECIMAL NOT NULL,
    amount_fiat DECIMAL NOT NULL,
    rate DECIMAL NOT NULL,
    trade_type TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trade_requests ENABLE ROW LEVEL SECURITY;

-- Simple RLS policy - users can see all open requests
DROP POLICY IF EXISTS "trade_requests_select_policy" ON public.trade_requests;
CREATE POLICY "trade_requests_select_policy" ON public.trade_requests 
FOR SELECT USING (status = 'open' AND expires_at > now());

-- Users can insert their own requests
DROP POLICY IF EXISTS "trade_requests_insert_policy" ON public.trade_requests;
CREATE POLICY "trade_requests_insert_policy" ON public.trade_requests 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own requests
DROP POLICY IF EXISTS "trade_requests_update_policy" ON public.trade_requests;
CREATE POLICY "trade_requests_update_policy" ON public.trade_requests 
FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 2. ENSURE MERCHANT TOGGLE FUNCTIONALITY
-- =============================================

-- First, make sure all users have proper merchant flags
UPDATE public.profiles
SET is_merchant = COALESCE(is_merchant, false),
    merchant_mode = COALESCE(merchant_mode, false)
WHERE is_merchant IS NULL OR merchant_mode IS NULL;

-- =============================================
-- 3. CREATE MERCHANT VIEW WITH PROPER TOGGLE LOGIC
-- =============================================

-- Drop and recreate merchant view
DROP VIEW IF EXISTS public.available_merchants CASCADE;

CREATE VIEW public.available_merchants AS
SELECT
    p.user_id as id,
    p.display_name,
    p.created_at,
    p.is_merchant,
    p.merchant_mode,
    p.is_premium,
    -- Calculate basic stats
    COALESCE(
        (SELECT COUNT(*) FROM public.trades t WHERE t.seller_id = p.user_id OR t.buyer_id = p.user_id),
        0
    ) as total_trades,
    COALESCE(
        (SELECT COUNT(*) FROM public.trades t WHERE (t.seller_id = p.user_id OR t.buyer_id = p.user_id) AND t.status = 'completed'),
        0
    ) as completed_trades
FROM public.profiles p
WHERE p.merchant_mode = true  -- Only show users who have merchant toggle ON
AND p.user_id IN (SELECT id FROM auth.users WHERE email_confirmed_at IS NOT NULL);

-- =============================================
-- 4. CREATE PREMIUM AUTO-MATCH FUNCTION
-- =============================================

-- Function for premium users to choose manual or auto match
CREATE OR REPLACE FUNCTION create_premium_trade_request(
    p_user_id UUID,
    p_crypto_type TEXT,
    p_amount_crypto DECIMAL,
    p_amount_fiat DECIMAL,
    p_rate DECIMAL,
    p_trade_type TEXT,
    p_payment_method TEXT,
    p_auto_match BOOLEAN DEFAULT false
)
RETURNS TABLE(
    request_id UUID,
    matched_merchant_id UUID,
    trade_id UUID,
    auto_matched BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_request_id UUID;
    v_merchant_id UUID;
    v_trade_id UUID;
    v_is_premium BOOLEAN;
BEGIN
    -- Check if user is premium
    SELECT is_premium INTO v_is_premium
    FROM public.profiles
    WHERE user_id = p_user_id;

    -- Create the trade request first
    INSERT INTO public.trade_requests (
        user_id, crypto_type, amount_crypto, amount_fiat, rate,
        trade_type, payment_method, status, expires_at
    ) VALUES (
        p_user_id, p_crypto_type, p_amount_crypto, p_amount_fiat, p_rate,
        p_trade_type, p_payment_method, 'open', now() + INTERVAL '24 hours'
    ) RETURNING id INTO v_request_id;

    -- If premium user wants auto-match, try to find a merchant
    IF v_is_premium AND p_auto_match THEN
        -- Find an available merchant
        SELECT id INTO v_merchant_id
        FROM public.available_merchants
        WHERE id != p_user_id
        ORDER BY RANDOM()
        LIMIT 1;

        IF v_merchant_id IS NOT NULL THEN
            -- Create the trade automatically
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
                CASE WHEN p_trade_type = 'sell' THEN p_user_id ELSE v_merchant_id END,
                CASE WHEN p_trade_type = 'buy' THEN p_user_id ELSE v_merchant_id END,
                p_crypto_type,
                p_amount_crypto,
                p_amount_fiat,
                p_rate,
                'pending',
                p_trade_type,
                p_payment_method
            ) RETURNING id INTO v_trade_id;

            -- Mark request as matched
            UPDATE public.trade_requests
            SET status = 'matched'
            WHERE id = v_request_id;

            -- Notify both users
            INSERT INTO public.notifications (user_id, title, message, type, data)
            VALUES
            (p_user_id, 'Auto-Match Successful',
             'Your premium trade was automatically matched!', 'trade_matched',
             jsonb_build_object('trade_id', v_trade_id, 'action', 'view_trade')),
            (v_merchant_id, 'New Trade Matched',
             'You have been matched with a premium trader', 'trade_matched',
             jsonb_build_object('trade_id', v_trade_id, 'action', 'view_trade'));

            RETURN QUERY SELECT v_request_id, v_merchant_id, v_trade_id, true, 'Auto-matched successfully!';
        ELSE
            RETURN QUERY SELECT v_request_id, NULL::UUID, NULL::UUID, false, 'No merchants available for auto-match. Request posted manually.';
        END IF;
    ELSE
        RETURN QUERY SELECT v_request_id, NULL::UUID, NULL::UUID, false, 'Trade request posted for manual matching.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 5. CREATE BASIC FUNCTIONS
-- =============================================

-- Simple function to create trade request
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
        user_id, crypto_type, amount_crypto, amount_fiat, rate, 
        trade_type, payment_method, status, expires_at
    ) VALUES (
        p_user_id, p_crypto_type, p_amount_crypto, p_amount_fiat, p_rate,
        p_trade_type, p_payment_method, 'open', now() + INTERVAL '24 hours'
    ) RETURNING id INTO v_request_id;
    
    RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple function to get available requests
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
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tr.id,
        tr.user_id,
        COALESCE(p.display_name, 'Anonymous') as user_display_name,
        tr.crypto_type,
        tr.amount_crypto,
        tr.amount_fiat,
        tr.rate,
        tr.trade_type,
        tr.payment_method,
        tr.created_at
    FROM public.trade_requests tr
    LEFT JOIN public.profiles p ON tr.user_id = p.user_id
    WHERE tr.status = 'open'
    AND tr.expires_at > now()
    AND tr.user_id != p_user_id
    ORDER BY tr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 6. ENABLE MERCHANT MODE FOR TESTING
-- =============================================

-- Enable merchant mode for at least one user for testing
DO $$
DECLARE
    v_user_id UUID;
    v_user_count INTEGER;
BEGIN
    -- Check how many users we have
    SELECT COUNT(*) INTO v_user_count FROM auth.users;

    IF v_user_count >= 2 THEN
        -- Enable merchant mode for the first user
        SELECT id INTO v_user_id FROM auth.users ORDER BY created_at LIMIT 1;

        UPDATE public.profiles
        SET is_merchant = true, merchant_mode = true
        WHERE user_id = v_user_id;

        RAISE NOTICE 'Enabled merchant mode for user: %', v_user_id;

        -- Create a sample trade request from the second user
        SELECT id INTO v_user_id FROM auth.users ORDER BY created_at OFFSET 1 LIMIT 1;

        BEGIN
            INSERT INTO public.trade_requests (
                user_id, crypto_type, amount_crypto, amount_fiat, rate,
                trade_type, payment_method, status, expires_at
            ) VALUES (
                v_user_id, 'USDT', 100, 165000, 1650,
                'buy', 'bank_transfer', 'open', now() + INTERVAL '24 hours'
            );

            RAISE NOTICE 'Created sample trade request from user: %', v_user_id;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create sample request: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Need at least 2 users for testing. Current users: %', v_user_count;
    END IF;
END $$;

-- =============================================
-- 7. SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ SUCCESS: Complete trade matching system with merchant toggle!';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 WHAT WAS CREATED:';
    RAISE NOTICE '• trade_requests table with correct columns';
    RAISE NOTICE '• available_merchants view (only shows merchant_mode = true)';
    RAISE NOTICE '• create_trade_request() function';
    RAISE NOTICE '• get_available_trade_requests() function';
    RAISE NOTICE '• create_premium_trade_request() function (manual/auto match)';
    RAISE NOTICE '• Merchant toggle functionality';
    RAISE NOTICE '• Basic RLS policies';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 HOW MERCHANT TOGGLE WORKS:';
    RAISE NOTICE '• merchant_mode = true → User appears in available_merchants';
    RAISE NOTICE '• merchant_mode = false → User does NOT appear in available_merchants';
    RAISE NOTICE '• Users can toggle this in their settings';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 HOW PREMIUM AUTO-MATCH WORKS:';
    RAISE NOTICE '• Premium users get asked: Manual or Auto match?';
    RAISE NOTICE '• Auto match: System finds merchant automatically';
    RAISE NOTICE '• Manual match: Posted as regular trade request';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TEST STEPS:';
    RAISE NOTICE '1. Toggle merchant mode ON for a user';
    RAISE NOTICE '2. Check available_merchants view';
    RAISE NOTICE '3. Create trade request from another user';
    RAISE NOTICE '4. Test premium auto-match functionality';
    RAISE NOTICE '5. Verify notifications are sent';
END $$;
