-- Add premium cash delivery fields to trade_requests table

ALTER TABLE trade_requests 
ADD COLUMN IF NOT EXISTS premium_cash_order_id UUID REFERENCES premium_cash_orders(id),
ADD COLUMN IF NOT EXISTS delivery_areas TEXT[],
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS vault_id TEXT;

-- Add index for premium cash orders
CREATE INDEX IF NOT EXISTS idx_trade_requests_premium_cash_order_id ON trade_requests(premium_cash_order_id);

-- Update payment_method to allow premium_cash_delivery
ALTER TABLE trade_requests ALTER COLUMN payment_method TYPE TEXT;