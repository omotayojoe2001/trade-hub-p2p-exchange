-- Debug script to check current trades and create test data if needed

-- First, let's see what trades exist
-- This will help us understand the current state

-- Create a function to debug trades
CREATE OR REPLACE FUNCTION debug_trades_info()
RETURNS TABLE (
    trade_count BIGINT,
    completed_count BIGINT,
    pending_count BIGINT,
    sample_trade_id UUID,
    sample_status TEXT,
    sample_escrow_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM trades) as trade_count,
        (SELECT COUNT(*) FROM trades WHERE status = 'completed') as completed_count,
        (SELECT COUNT(*) FROM trades WHERE status = 'pending') as pending_count,
        (SELECT id FROM trades ORDER BY created_at DESC LIMIT 1) as sample_trade_id,
        (SELECT status FROM trades ORDER BY created_at DESC LIMIT 1) as sample_status,
        (SELECT escrow_status FROM trades ORDER BY created_at DESC LIMIT 1) as sample_escrow_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission
GRANT EXECUTE ON FUNCTION debug_trades_info TO authenticated;

-- If there are no completed trades, let's create a test completed trade
-- This will help verify that the MyTrades page can display completed trades

DO $$
DECLARE
    test_user_id UUID;
    test_trade_id UUID;
    trade_count INTEGER;
BEGIN
    -- Check if we have any completed trades
    SELECT COUNT(*) INTO trade_count FROM trades WHERE status = 'completed';
    
    -- If no completed trades exist, create a test one
    IF trade_count = 0 THEN
        -- Get a user ID (any authenticated user)
        SELECT id INTO test_user_id FROM auth.users LIMIT 1;
        
        IF test_user_id IS NOT NULL THEN
            -- Create a test completed trade
            INSERT INTO trades (
                buyer_id,
                seller_id,
                coin_type,
                amount,
                amount_crypto,
                amount_fiat,
                naira_amount,
                rate,
                net_amount,
                trade_type,
                status,
                escrow_status,
                completed_at,
                crypto_sender_id,
                cash_sender_id
            ) VALUES (
                test_user_id,
                test_user_id, -- Same user for testing
                'USDT',
                100.0,
                100.0,
                165000.0,
                165000.0,
                1650.0,
                165000.0,
                'sell',
                'completed',
                'completed',
                NOW() - INTERVAL '1 hour',
                test_user_id,
                test_user_id
            ) RETURNING id INTO test_trade_id;
            
            RAISE NOTICE 'Created test completed trade with ID: %', test_trade_id;
        END IF;
    END IF;
END $$;