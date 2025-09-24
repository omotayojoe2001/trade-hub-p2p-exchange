-- Fix trade completion and ensure completed trades show up in MyTrades

-- Update the SellCryptoPaymentStep3 completion logic to use proper status values
-- The issue is that the payment step files are updating trades directly instead of using the RPC functions

-- Create a simple function to complete a trade
CREATE OR REPLACE FUNCTION complete_trade(
    trade_id_param UUID,
    user_id_param UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    trade_record trades%ROWTYPE;
BEGIN
    -- Get the trade record
    SELECT * INTO trade_record FROM trades WHERE id = trade_id_param;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Trade not found');
    END IF;
    
    -- Complete the trade
    UPDATE trades 
    SET 
        status = 'completed',
        escrow_status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = trade_id_param;
    
    RETURN json_build_object('success', true, 'message', 'Trade completed successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission
GRANT EXECUTE ON FUNCTION complete_trade TO authenticated;

-- Fix any existing trades that might have wrong status
-- Update trades that should be completed but have wrong status
UPDATE trades 
SET 
    status = 'completed',
    escrow_status = 'completed',
    completed_at = COALESCE(completed_at, updated_at, NOW())
WHERE 
    (status = 'crypto_deposited' OR status = 'payment_sent')
    AND updated_at < NOW() - INTERVAL '1 hour';  -- Trades older than 1 hour should be completed

-- Ensure all completed trades have proper completed_at timestamp
UPDATE trades 
SET completed_at = COALESCE(completed_at, updated_at, NOW())
WHERE status = 'completed' AND completed_at IS NULL;