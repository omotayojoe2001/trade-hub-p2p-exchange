-- Create functions for trade management

-- Function to upload payment proof
CREATE OR REPLACE FUNCTION upload_payment_proof(
    trade_id_param UUID,
    user_id_param UUID,
    proof_url_param TEXT DEFAULT NULL,
    payment_hash_param TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    trade_record trades%ROWTYPE;
    result JSON;
BEGIN
    -- Get the trade record
    SELECT * INTO trade_record FROM trades WHERE id = trade_id_param;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Trade not found');
    END IF;
    
    -- Check if user is authorized (cash sender)
    IF trade_record.cash_sender_id != user_id_param THEN
        RETURN json_build_object('success', false, 'error', 'Not authorized to upload payment proof');
    END IF;
    
    -- Check if trade is in correct state
    IF trade_record.escrow_status != 'crypto_received' THEN
        RETURN json_build_object('success', false, 'error', 'Trade not ready for payment proof');
    END IF;
    
    -- Update trade with payment proof
    UPDATE trades 
    SET 
        payment_proof_url = proof_url_param,
        payment_hash = payment_hash_param,
        payment_proof_uploaded_at = NOW(),
        escrow_status = 'payment_proof_uploaded',
        updated_at = NOW()
    WHERE id = trade_id_param;
    
    RETURN json_build_object('success', true, 'message', 'Payment proof uploaded successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to confirm payment received
CREATE OR REPLACE FUNCTION confirm_payment_received(
    trade_id_param UUID,
    user_id_param UUID
)
RETURNS JSON AS $$
DECLARE
    trade_record trades%ROWTYPE;
    result JSON;
BEGIN
    -- Get the trade record
    SELECT * INTO trade_record FROM trades WHERE id = trade_id_param;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Trade not found');
    END IF;
    
    -- Check if user is authorized (crypto sender)
    IF trade_record.crypto_sender_id != user_id_param THEN
        RETURN json_build_object('success', false, 'error', 'Not authorized to confirm payment');
    END IF;
    
    -- Check if trade is in correct state
    IF trade_record.escrow_status != 'payment_proof_uploaded' THEN
        RETURN json_build_object('success', false, 'error', 'Payment proof not uploaded yet');
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

-- Function to dispute payment
CREATE OR REPLACE FUNCTION dispute_payment(
    trade_id_param UUID,
    user_id_param UUID,
    dispute_reason_param TEXT
)
RETURNS JSON AS $$
DECLARE
    trade_record trades%ROWTYPE;
    result JSON;
BEGIN
    -- Get the trade record
    SELECT * INTO trade_record FROM trades WHERE id = trade_id_param;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Trade not found');
    END IF;
    
    -- Check if user is authorized (crypto sender)
    IF trade_record.crypto_sender_id != user_id_param THEN
        RETURN json_build_object('success', false, 'error', 'Not authorized to dispute payment');
    END IF;
    
    -- Check if trade is in correct state
    IF trade_record.escrow_status != 'payment_proof_uploaded' THEN
        RETURN json_build_object('success', false, 'error', 'Payment proof not uploaded yet');
    END IF;
    
    -- Create dispute
    UPDATE trades 
    SET 
        status = 'disputed',
        escrow_status = 'disputed',
        dispute_reason = dispute_reason_param,
        disputed_at = NOW(),
        updated_at = NOW()
    WHERE id = trade_id_param;
    
    RETURN json_build_object('success', true, 'message', 'Dispute created successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add missing columns to trades table if they don't exist
DO $$ 
BEGIN
    -- Add payment_proof_uploaded_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trades' AND column_name = 'payment_proof_uploaded_at') THEN
        ALTER TABLE trades ADD COLUMN payment_proof_uploaded_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add payment_hash column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trades' AND column_name = 'payment_hash') THEN
        ALTER TABLE trades ADD COLUMN payment_hash TEXT;
    END IF;
    
    -- Add crypto_sender_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trades' AND column_name = 'crypto_sender_id') THEN
        ALTER TABLE trades ADD COLUMN crypto_sender_id UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add cash_sender_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trades' AND column_name = 'cash_sender_id') THEN
        ALTER TABLE trades ADD COLUMN cash_sender_id UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add escrow_expires_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trades' AND column_name = 'escrow_expires_at') THEN
        ALTER TABLE trades ADD COLUMN escrow_expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add dispute_reason column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trades' AND column_name = 'dispute_reason') THEN
        ALTER TABLE trades ADD COLUMN dispute_reason TEXT;
    END IF;
    
    -- Add disputed_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trades' AND column_name = 'disputed_at') THEN
        ALTER TABLE trades ADD COLUMN disputed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Update escrow_status enum to include new values
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_escrow_status_check;
ALTER TABLE trades ADD CONSTRAINT trades_escrow_status_check 
    CHECK (escrow_status IN ('pending', 'crypto_received', 'payment_proof_uploaded', 'cash_received', 'completed', 'disputed'));

-- Grant permissions
GRANT EXECUTE ON FUNCTION upload_payment_proof TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_payment_received TO authenticated;
GRANT EXECUTE ON FUNCTION dispute_payment TO authenticated;