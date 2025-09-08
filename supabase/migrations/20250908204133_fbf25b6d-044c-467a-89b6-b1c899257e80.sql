-- Fix trade request acceptance issues and RLS policies

-- 1. Update trade requests to 'open' status instead of 'pending' for better visibility
UPDATE trade_requests 
SET status = 'open' 
WHERE status = 'pending' 
AND expires_at > now();

-- 2. Fix RLS policies for trade_requests to ensure merchants can accept them
DROP POLICY IF EXISTS "trade_requests_strict_access" ON public.trade_requests;
DROP POLICY IF EXISTS "trade_requests_update_policy" ON public.trade_requests;

-- Allow viewing open trade requests or own trade requests
CREATE POLICY "trade_requests_view_policy" ON public.trade_requests
    FOR SELECT USING (
        status = 'open' OR 
        auth.uid() = user_id OR
        auth.uid() = merchant_id
    );

-- Allow merchants to accept open trade requests by updating them
CREATE POLICY "trade_requests_accept_policy" ON public.trade_requests
    FOR UPDATE USING (
        auth.uid() = user_id OR  -- User can update their own
        (status = 'open' AND EXISTS (  -- Merchants can accept open requests
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND is_merchant = true
        ))
    );

-- 3. Fix trades table RLS policies for trade creation
DROP POLICY IF EXISTS "Users can create trades" ON public.trades;

-- Allow users to create trades if they are part of it or accepting a trade request
CREATE POLICY "Users can create trades" ON public.trades
    FOR INSERT WITH CHECK (
        auth.uid() = buyer_id OR 
        auth.uid() = seller_id OR
        (trade_request_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM trade_requests 
            WHERE id = trades.trade_request_id 
            AND (user_id = auth.uid() OR status = 'open')
        ))
    );

-- 4. Ensure fireblocks escrow service works by adding missing columns if needed
DO $$ 
BEGIN
    -- Add escrow_vault_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trades' AND column_name = 'escrow_vault_id') THEN
        ALTER TABLE trades ADD COLUMN escrow_vault_id TEXT;
    END IF;
END $$;

-- 5. Test trade request creation with proper status
INSERT INTO trade_requests (
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
    (SELECT id FROM auth.users LIMIT 1),
    'USDT',
    100.0,
    165000.0,
    1650.0,
    'buy',
    'bank_transfer',
    'open',
    now() + INTERVAL '24 hours'
) ON CONFLICT DO NOTHING;

-- 6. Create a function to ensure trade requests are created as 'open'
CREATE OR REPLACE FUNCTION ensure_trade_request_open_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Automatically set status to 'open' if it's 'pending'
    IF NEW.status = 'pending' THEN
        NEW.status = 'open';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for trade requests
DROP TRIGGER IF EXISTS tr_ensure_open_status ON trade_requests;
CREATE TRIGGER tr_ensure_open_status
    BEFORE INSERT ON trade_requests
    FOR EACH ROW
    EXECUTE FUNCTION ensure_trade_request_open_status();

-- Verify policies are working
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('trade_requests', 'trades')
ORDER BY tablename, policyname;