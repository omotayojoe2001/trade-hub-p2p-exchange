-- Create auto-expire functions for trade requests and escrow trades

-- Function to auto-expire old trade requests
CREATE OR REPLACE FUNCTION auto_expire_trade_requests()
RETURNS void AS $$
BEGIN
    -- Mark expired trade requests as expired
    UPDATE trade_requests 
    SET 
        status = 'expired',
        updated_at = NOW()
    WHERE 
        status IN ('open', 'pending') 
        AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-expire escrow trades where cash payment wasn't made
CREATE OR REPLACE FUNCTION auto_expire_escrow_trades()
RETURNS void AS $$
BEGIN
    -- Cancel trades where escrow expired and no payment proof was uploaded
    UPDATE trades 
    SET 
        status = 'cancelled',
        escrow_status = 'expired',
        updated_at = NOW()
    WHERE 
        status = 'pending'
        AND escrow_status = 'crypto_received'
        AND escrow_expires_at < NOW()
        AND payment_proof_uploaded_at IS NULL;
        
    -- Also handle trades where payment proof was uploaded but not confirmed within reasonable time
    UPDATE trades 
    SET 
        status = 'disputed',
        escrow_status = 'disputed',
        dispute_reason = 'Auto-disputed: Payment confirmation timeout',
        disputed_at = NOW(),
        updated_at = NOW()
    WHERE 
        status = 'pending'
        AND escrow_status = 'payment_proof_uploaded'
        AND payment_proof_uploaded_at < NOW() - INTERVAL '2 hours'
        AND completed_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION auto_expire_trade_requests TO authenticated;
GRANT EXECUTE ON FUNCTION auto_expire_escrow_trades TO authenticated;