-- Simple Buy Crypto Flow Fix

-- 1. Add missing columns
ALTER TABLE trade_requests 
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'pending';

ALTER TABLE trades
ADD COLUMN IF NOT EXISTS trade_request_id UUID,
ADD COLUMN IF NOT EXISTS escrow_status VARCHAR DEFAULT 'pending';

-- 2. Create simulation function
CREATE OR REPLACE FUNCTION simulate_merchant_accept_trade(request_id UUID)
RETURNS void AS $$
DECLARE
  merchant_id UUID;
  request_data RECORD;
BEGIN
  -- Get any merchant user
  SELECT user_id INTO merchant_id 
  FROM profiles 
  WHERE is_merchant = true 
  LIMIT 1;
  
  -- If no merchant exists, make current user a merchant
  IF merchant_id IS NULL THEN
    UPDATE profiles 
    SET is_merchant = true, merchant_mode = true 
    WHERE user_id = auth.uid();
    merchant_id := auth.uid();
  END IF;
  
  -- Get trade request data
  SELECT * INTO request_data FROM trade_requests WHERE id = request_id;
  
  -- Update trade request to accepted
  UPDATE trade_requests 
  SET status = 'accepted', merchant_id = merchant_id
  WHERE id = request_id;
  
  -- Create trade record
  INSERT INTO trades (
    trade_request_id,
    buyer_id,
    seller_id,
    crypto_type,
    amount_crypto,
    amount_fiat,
    escrow_status,
    status
  ) VALUES (
    request_id,
    request_data.user_id,
    merchant_id,
    request_data.crypto_type,
    request_data.amount_crypto,
    request_data.amount_fiat,
    'crypto_deposited',
    'active'
  );
END;
$$ LANGUAGE plpgsql;