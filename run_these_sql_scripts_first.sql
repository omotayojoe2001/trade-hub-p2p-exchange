-- RUN THESE SQL SCRIPTS IN ORDER IN SUPABASE SQL EDITOR

-- 1. Fix premium_cash_orders status constraint
ALTER TABLE premium_cash_orders DROP CONSTRAINT IF EXISTS premium_cash_orders_status_check;
ALTER TABLE premium_cash_orders ALTER COLUMN status TYPE TEXT;
ALTER TABLE premium_cash_orders 
ADD CONSTRAINT premium_cash_orders_status_check 
CHECK (status IN ('pending','awaiting_merchant','merchant_accepted','payment_sent','vendor_assigned','vendor_confirmed','out_for_delivery','completed','cancelled','disputed'));

-- 2. Add missing columns to premium_cash_orders
ALTER TABLE premium_cash_orders 
ADD COLUMN IF NOT EXISTS escrow_address TEXT,
ADD COLUMN IF NOT EXISTS vault_id TEXT,
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES auth.users(id);

-- 3. Add premium fields to trade_requests
ALTER TABLE trade_requests 
ADD COLUMN IF NOT EXISTS premium_cash_order_id UUID REFERENCES premium_cash_orders(id),
ADD COLUMN IF NOT EXISTS delivery_areas TEXT[],
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS vault_id TEXT;

-- 4. Update payment_method to allow premium_cash_delivery
ALTER TABLE trade_requests ALTER COLUMN payment_method TYPE TEXT;

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_trade_requests_premium_cash_order_id ON trade_requests(premium_cash_order_id);
CREATE INDEX IF NOT EXISTS idx_premium_cash_orders_merchant_id ON premium_cash_orders(merchant_id);