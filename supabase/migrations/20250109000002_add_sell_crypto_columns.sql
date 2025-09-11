-- Add additional columns needed for sell crypto flow

-- Add columns for escrow and merchant details
ALTER TABLE public.trade_requests 
ADD COLUMN IF NOT EXISTS escrow_address TEXT,
ADD COLUMN IF NOT EXISTS vault_id TEXT,
ADD COLUMN IF NOT EXISTS merchant_wallet_address TEXT,
ADD COLUMN IF NOT EXISTS merchant_payment_proof TEXT,
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;

-- Update status constraint to include new statuses
ALTER TABLE public.trade_requests 
DROP CONSTRAINT IF EXISTS trade_requests_status_check;

ALTER TABLE public.trade_requests 
ADD CONSTRAINT trade_requests_status_check 
CHECK (status IN ('open', 'accepted', 'crypto_deposited', 'payment_sent', 'completed', 'rejected', 'cancelled', 'expired'));

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_trade_requests_escrow_address ON public.trade_requests(escrow_address);
CREATE INDEX IF NOT EXISTS idx_trade_requests_vault_id ON public.trade_requests(vault_id);
CREATE INDEX IF NOT EXISTS idx_trade_requests_accepted_at ON public.trade_requests(accepted_at);

-- Add comments
COMMENT ON COLUMN public.trade_requests.escrow_address IS 'Fireblocks escrow address for crypto deposit';
COMMENT ON COLUMN public.trade_requests.vault_id IS 'Fireblocks vault ID for escrow';
COMMENT ON COLUMN public.trade_requests.merchant_wallet_address IS 'Merchant wallet address to receive crypto';
COMMENT ON COLUMN public.trade_requests.merchant_payment_proof IS 'Merchant payment proof file name';
COMMENT ON COLUMN public.trade_requests.accepted_at IS 'When merchant accepted the trade request';