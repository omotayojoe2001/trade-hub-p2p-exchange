-- Update credits system to support USDT payments

-- 1. Update credit_purchases table to support USDT
ALTER TABLE credit_purchases 
DROP CONSTRAINT IF EXISTS credit_purchases_crypto_type_check;

ALTER TABLE credit_purchases 
ADD CONSTRAINT credit_purchases_crypto_type_check 
CHECK (crypto_type IN ('BTC', 'ETH', 'USDT'));

-- 2. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_credit_purchases_payment_address ON credit_purchases(payment_address);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_status ON credit_purchases(status);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_user_id ON credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_created_at ON credit_purchases(created_at);

-- 3. Add indexes for escrow_addresses
CREATE INDEX IF NOT EXISTS idx_escrow_addresses_address ON escrow_addresses(address);
CREATE INDEX IF NOT EXISTS idx_escrow_addresses_status ON escrow_addresses(status);
CREATE INDEX IF NOT EXISTS idx_escrow_addresses_trade_id ON escrow_addresses(trade_id);

-- 4. Enable RLS on credit tables
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for credit_purchases
DROP POLICY IF EXISTS "Users can view their own credit purchases" ON credit_purchases;
CREATE POLICY "Users can view their own credit purchases" ON credit_purchases
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own credit purchases" ON credit_purchases;
CREATE POLICY "Users can insert their own credit purchases" ON credit_purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can update credit purchases" ON credit_purchases;
CREATE POLICY "System can update credit purchases" ON credit_purchases
    FOR UPDATE USING (true);

-- 6. Create RLS policies for credit_transactions
DROP POLICY IF EXISTS "Users can view their own credit transactions" ON credit_transactions;
CREATE POLICY "Users can view their own credit transactions" ON credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert credit transactions" ON credit_transactions;
CREATE POLICY "System can insert credit transactions" ON credit_transactions
    FOR INSERT WITH CHECK (true);

-- 7. Grant service role permissions for webhook
GRANT ALL ON credit_purchases TO service_role;
GRANT ALL ON credit_transactions TO service_role;
GRANT ALL ON escrow_addresses TO service_role;
GRANT ALL ON trades TO service_role;
GRANT ALL ON notifications TO service_role;