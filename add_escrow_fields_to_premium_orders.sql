-- Add escrow fields to premium_cash_orders table

ALTER TABLE premium_cash_orders 
ADD COLUMN IF NOT EXISTS escrow_address TEXT,
ADD COLUMN IF NOT EXISTS vault_id TEXT,
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_premium_cash_orders_vault_id ON premium_cash_orders(vault_id);
CREATE INDEX IF NOT EXISTS idx_premium_cash_orders_escrow_address ON premium_cash_orders(escrow_address);

-- Update status enum to include crypto_deposited
ALTER TABLE premium_cash_orders 
ALTER COLUMN status TYPE TEXT;

-- Add comment for clarity
COMMENT ON COLUMN premium_cash_orders.escrow_address IS 'BitGo escrow address for crypto deposit';
COMMENT ON COLUMN premium_cash_orders.vault_id IS 'BitGo vault ID for tracking';
COMMENT ON COLUMN premium_cash_orders.payment_proof_url IS 'URL to uploaded payment proof screenshot';