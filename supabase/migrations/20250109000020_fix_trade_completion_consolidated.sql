-- Consolidated migration to fix trade completion issues
-- This single file contains all necessary fixes

-- 1. Add missing columns to trades table
DO $$ 
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'payment_proof_uploaded_at') THEN
        ALTER TABLE trades ADD COLUMN payment_proof_uploaded_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'payment_hash') THEN
        ALTER TABLE trades ADD COLUMN payment_hash TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'crypto_sender_id') THEN
        ALTER TABLE trades ADD COLUMN crypto_sender_id UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'cash_sender_id') THEN
        ALTER TABLE trades ADD COLUMN cash_sender_id UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'escrow_expires_at') THEN
        ALTER TABLE trades ADD COLUMN escrow_expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'dispute_reason') THEN
        ALTER TABLE trades ADD COLUMN dispute_reason TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'disputed_at') THEN
        ALTER TABLE trades ADD COLUMN disputed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. Fix existing escrow_status values first
UPDATE trades 
SET escrow_status = CASE 
    WHEN escrow_status = 'crypto_deposited' THEN 'crypto_received'
    WHEN escrow_status = 'payment_sent' THEN 'cash_received'
    WHEN escrow_status IS NULL THEN 'pending'
    WHEN escrow_status NOT IN ('pending', 'crypto_received', 'payment_proof_uploaded', 'cash_received', 'completed', 'disputed') THEN 'pending'
    ELSE escrow_status
END;

-- 3. Update escrow_status enum
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_escrow_status_check;
ALTER TABLE trades ADD CONSTRAINT trades_escrow_status_check 
    CHECK (escrow_status IN ('pending', 'crypto_received', 'payment_proof_uploaded', 'cash_received', 'completed', 'disputed'));

-- 4. Drop existing functions first
DROP FUNCTION IF EXISTS upload_payment_proof(UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS confirm_payment_received(UUID, UUID);
DROP FUNCTION IF EXISTS dispute_payment(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS complete_trade(UUID, UUID);
DROP FUNCTION IF EXISTS auto_expire_trade_requests();
DROP FUNCTION IF EXISTS auto_expire_escrow_trades();

-- 5. Create trade management functions
CREATE OR REPLACE FUNCTION upload_payment_proof(
    trade_id_param UUID,
    user_id_param UUID,
    proof_url_param TEXT DEFAULT NULL,
    payment_hash_param TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    trade_record trades%ROWTYPE;
BEGIN
    SELECT * INTO trade_record FROM trades WHERE id = trade_id_param;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Trade not found');
    END IF;
    
    IF trade_record.cash_sender_id != user_id_param THEN
        RETURN json_build_object('success', false, 'error', 'Not authorized');
    END IF;
    
    UPDATE trades 
    SET 
        payment_proof_url = proof_url_param,
        payment_hash = payment_hash_param,
        payment_proof_uploaded_at = NOW(),
        escrow_status = 'payment_proof_uploaded',
        updated_at = NOW()
    WHERE id = trade_id_param;
    
    RETURN json_build_object('success', true, 'message', 'Payment proof uploaded');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION confirm_payment_received(
    trade_id_param UUID,
    user_id_param UUID
)
RETURNS JSON AS $$
BEGIN
    UPDATE trades 
    SET 
        status = 'completed',
        escrow_status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = trade_id_param;
    
    RETURN json_build_object('success', true, 'message', 'Trade completed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION dispute_payment(
    trade_id_param UUID,
    user_id_param UUID,
    dispute_reason_param TEXT
)
RETURNS JSON AS $$
BEGIN
    UPDATE trades 
    SET 
        status = 'disputed',
        escrow_status = 'disputed',
        dispute_reason = dispute_reason_param,
        disputed_at = NOW(),
        updated_at = NOW()
    WHERE id = trade_id_param;
    
    RETURN json_build_object('success', true, 'message', 'Dispute created');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION complete_trade(
    trade_id_param UUID,
    user_id_param UUID DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    UPDATE trades 
    SET 
        status = 'completed',
        escrow_status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = trade_id_param;
    
    RETURN json_build_object('success', true, 'message', 'Trade completed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auto_expire_trade_requests()
RETURNS void AS $$
BEGIN
    UPDATE trade_requests 
    SET status = 'expired', updated_at = NOW()
    WHERE status IN ('open', 'pending') AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auto_expire_escrow_trades()
RETURNS void AS $$
BEGIN
    UPDATE trades 
    SET status = 'cancelled', escrow_status = 'expired', updated_at = NOW()
    WHERE status = 'pending' AND escrow_status = 'crypto_received' 
    AND escrow_expires_at < NOW() AND payment_proof_uploaded_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create trigger to set sender IDs
CREATE OR REPLACE FUNCTION set_trade_sender_ids()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.trade_type = 'buy' THEN
        NEW.crypto_sender_id = NEW.seller_id;
        NEW.cash_sender_id = NEW.buyer_id;
    ELSIF NEW.trade_type = 'sell' THEN
        NEW.crypto_sender_id = NEW.buyer_id;
        NEW.cash_sender_id = NEW.seller_id;
    END IF;
    
    IF NEW.escrow_expires_at IS NULL THEN
        NEW.escrow_expires_at = NOW() + INTERVAL '30 minutes';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_set_trade_sender_ids ON trades;
CREATE TRIGGER tr_set_trade_sender_ids
    BEFORE INSERT OR UPDATE ON trades
    FOR EACH ROW
    EXECUTE FUNCTION set_trade_sender_ids();

-- 7. Update existing trades
UPDATE trades 
SET 
    crypto_sender_id = CASE 
        WHEN trade_type = 'buy' THEN seller_id 
        WHEN trade_type = 'sell' THEN buyer_id 
        ELSE crypto_sender_id 
    END,
    cash_sender_id = CASE 
        WHEN trade_type = 'buy' THEN buyer_id 
        WHEN trade_type = 'sell' THEN seller_id 
        ELSE cash_sender_id 
    END,
    escrow_expires_at = CASE 
        WHEN escrow_expires_at IS NULL THEN created_at + INTERVAL '30 minutes'
        ELSE escrow_expires_at 
    END,
    completed_at = CASE 
        WHEN status = 'completed' AND completed_at IS NULL THEN COALESCE(updated_at, NOW())
        ELSE completed_at 
    END
WHERE crypto_sender_id IS NULL OR cash_sender_id IS NULL OR escrow_expires_at IS NULL OR (status = 'completed' AND completed_at IS NULL);

-- 8. Grant permissions
GRANT EXECUTE ON FUNCTION upload_payment_proof TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_payment_received TO authenticated;
GRANT EXECUTE ON FUNCTION dispute_payment TO authenticated;
GRANT EXECUTE ON FUNCTION complete_trade TO authenticated;
GRANT EXECUTE ON FUNCTION auto_expire_trade_requests TO authenticated;
GRANT EXECUTE ON FUNCTION auto_expire_escrow_trades TO authenticated;