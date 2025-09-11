-- Add escrow expiry tracking and payment proof system to trades table
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS escrow_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS crypto_sender_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS cash_sender_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS payment_proof_uploaded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_hash TEXT,
ADD COLUMN IF NOT EXISTS dispute_reason TEXT,
ADD COLUMN IF NOT EXISTS disputed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES auth.users(id);

-- Function to set escrow expiry when crypto is received
CREATE OR REPLACE FUNCTION set_escrow_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- When escrow_status changes to 'crypto_received', set 30-minute expiry
  IF NEW.escrow_status = 'crypto_received' AND OLD.escrow_status != 'crypto_received' THEN
    NEW.escrow_expires_at = NOW() + INTERVAL '30 minutes';
    
    -- Set crypto and cash sender IDs based on trade type
    IF NEW.trade_type = 'buy' THEN
      NEW.crypto_sender_id = NEW.seller_id;  -- Merchant sends crypto
      NEW.cash_sender_id = NEW.buyer_id;     -- Buyer sends cash
    ELSE
      NEW.crypto_sender_id = NEW.buyer_id;   -- Seller sends crypto  
      NEW.cash_sender_id = NEW.seller_id;    -- Merchant sends cash
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set escrow expiry
DROP TRIGGER IF EXISTS trigger_set_escrow_expiry ON trades;
CREATE TRIGGER trigger_set_escrow_expiry
  BEFORE UPDATE ON trades
  FOR EACH ROW
  EXECUTE FUNCTION set_escrow_expiry();

-- Create disputes table for tracking dispute resolution
CREATE TABLE IF NOT EXISTS trade_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES trades(id),
  disputed_by UUID NOT NULL REFERENCES auth.users(id),
  dispute_reason TEXT NOT NULL,
  evidence_urls TEXT[],
  admin_notes TEXT,
  resolution TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to auto-expire trades where cash payment wasn't made in time
-- Only expires if NO payment proof has been uploaded
CREATE OR REPLACE FUNCTION auto_expire_escrow_trades()
RETURNS void AS $$
BEGIN
  UPDATE trades 
  SET status = 'expired',
      escrow_status = 'crypto_returned'
  WHERE escrow_status = 'crypto_received' 
    AND escrow_expires_at < NOW()
    AND payment_proof_uploaded_at IS NULL  -- Only expire if no proof uploaded
    AND status NOT IN ('completed', 'cancelled', 'disputed');
END;
$$ LANGUAGE plpgsql;

-- Function to handle payment proof upload
CREATE OR REPLACE FUNCTION upload_payment_proof(
  trade_id_param UUID,
  user_id_param UUID,
  proof_url_param TEXT DEFAULT NULL,
  payment_hash_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  trade_record trades%ROWTYPE;
BEGIN
  -- Get trade record
  SELECT * INTO trade_record FROM trades WHERE id = trade_id_param;
  
  -- Verify user is the cash sender
  IF trade_record.cash_sender_id != user_id_param THEN
    RAISE EXCEPTION 'Only cash sender can upload payment proof';
  END IF;
  
  -- Verify escrow status
  IF trade_record.escrow_status != 'crypto_received' THEN
    RAISE EXCEPTION 'Can only upload proof when crypto is in escrow';
  END IF;
  
  -- Update trade with payment proof
  UPDATE trades 
  SET payment_proof_url = proof_url_param,
      payment_hash = payment_hash_param,
      payment_proof_uploaded_at = NOW(),
      escrow_status = 'payment_proof_uploaded',
      escrow_expires_at = NULL  -- Remove expiry timer
  WHERE id = trade_id_param;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to confirm payment received (crypto sender)
CREATE OR REPLACE FUNCTION confirm_payment_received(
  trade_id_param UUID,
  user_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  trade_record trades%ROWTYPE;
BEGIN
  -- Get trade record
  SELECT * INTO trade_record FROM trades WHERE id = trade_id_param;
  
  -- Verify user is the crypto sender
  IF trade_record.crypto_sender_id != user_id_param THEN
    RAISE EXCEPTION 'Only crypto sender can confirm payment received';
  END IF;
  
  -- Verify payment proof exists
  IF trade_record.escrow_status != 'payment_proof_uploaded' THEN
    RAISE EXCEPTION 'Payment proof must be uploaded first';
  END IF;
  
  -- Complete the trade
  UPDATE trades 
  SET status = 'completed',
      escrow_status = 'crypto_released',
      completed_at = NOW()
  WHERE id = trade_id_param;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to dispute payment (crypto sender)
CREATE OR REPLACE FUNCTION dispute_payment(
  trade_id_param UUID,
  user_id_param UUID,
  dispute_reason_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  trade_record trades%ROWTYPE;
BEGIN
  -- Get trade record
  SELECT * INTO trade_record FROM trades WHERE id = trade_id_param;
  
  -- Verify user is the crypto sender
  IF trade_record.crypto_sender_id != user_id_param THEN
    RAISE EXCEPTION 'Only crypto sender can dispute payment';
  END IF;
  
  -- Verify payment proof exists
  IF trade_record.escrow_status != 'payment_proof_uploaded' THEN
    RAISE EXCEPTION 'Can only dispute after payment proof is uploaded';
  END IF;
  
  -- Create dispute
  UPDATE trades 
  SET status = 'disputed',
      escrow_status = 'disputed',
      dispute_reason = dispute_reason_param,
      disputed_at = NOW()
  WHERE id = trade_id_param;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;