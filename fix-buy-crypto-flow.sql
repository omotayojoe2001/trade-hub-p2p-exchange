-- Fix Buy Crypto Flow Database Queries

-- 1. Ensure trade_requests table has correct structure
ALTER TABLE trade_requests 
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- 2. Ensure trades table has correct structure  
ALTER TABLE trades
ADD COLUMN IF NOT EXISTS trade_request_id UUID REFERENCES trade_requests(id),
ADD COLUMN IF NOT EXISTS escrow_status VARCHAR DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS amount_crypto DECIMAL,
ADD COLUMN IF NOT EXISTS amount_fiat DECIMAL;

-- 3. Create merchant profile from existing user (update any existing user to be a merchant)
UPDATE profiles 
SET is_merchant = true, 
    merchant_mode = true, 
    is_active = true,
    display_name = COALESCE(display_name, 'Test Merchant')
WHERE user_id != (SELECT auth.uid()) -- Don't update current user
LIMIT 1;

-- 5. Function to simulate merchant accepting trade request
CREATE OR REPLACE FUNCTION simulate_merchant_accept_trade(request_id UUID)
RETURNS void AS $$
DECLARE
  merchant_id UUID;
BEGIN
  -- Get a merchant user
  SELECT user_id INTO merchant_id 
  FROM profiles 
  WHERE is_merchant = true 
  LIMIT 1;
  
  -- Update trade request to accepted
  UPDATE trade_requests 
  SET status = 'accepted', merchant_id = merchant_id
  WHERE id = request_id;
  
  -- Create trade record with escrow funded
  INSERT INTO trades (
    trade_request_id,
    buyer_id,
    seller_id,
    crypto_type,
    amount_crypto,
    amount_fiat,
    escrow_status,
    status
  )
  SELECT 
    tr.id,
    tr.user_id,
    merchant_id,
    tr.crypto_type,
    tr.amount_crypto,
    tr.amount_fiat,
    'crypto_deposited',
    'active'
  FROM trade_requests tr
  WHERE tr.id = request_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Enable RLS policies (if needed)
ALTER TABLE trade_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own trade requests" ON trade_requests;
DROP POLICY IF EXISTS "Users can create trade requests" ON trade_requests;
DROP POLICY IF EXISTS "Merchants can update trade requests" ON trade_requests;
DROP POLICY IF EXISTS "Users can view their trades" ON trades;
DROP POLICY IF EXISTS "System can create trades" ON trades;
DROP POLICY IF EXISTS "Users can update their trades" ON trades;

-- 8. Create RLS policies for trade_requests
CREATE POLICY "Users can view their own trade requests" ON trade_requests
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = merchant_id);

CREATE POLICY "Users can create trade requests" ON trade_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Merchants can update trade requests" ON trade_requests
  FOR UPDATE USING (auth.uid() = merchant_id);

-- 9. Create RLS policies for trades
CREATE POLICY "Users can view their trades" ON trades
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "System can create trades" ON trades
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their trades" ON trades
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);