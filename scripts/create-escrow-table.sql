-- Create escrow_transactions table for proper crypto escrow handling

CREATE TABLE IF NOT EXISTS public.escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  
  -- Participants
  crypto_sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crypto_receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cash_sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cash_receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Transaction details
  crypto_type TEXT NOT NULL CHECK (crypto_type IN ('BTC', 'ETH', 'USDT')),
  crypto_amount NUMERIC(20,8) NOT NULL,
  cash_amount NUMERIC(15,2) NOT NULL,
  
  -- Platform escrow details
  platform_wallet_address TEXT NOT NULL,
  crypto_tx_hash TEXT, -- Transaction hash when crypto is sent to platform
  cash_payment_proof TEXT, -- Proof of cash payment (receipt, screenshot, etc.)
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending_crypto' CHECK (status IN (
    'pending_crypto',    -- Waiting for crypto to be sent to platform
    'crypto_received',   -- Crypto received by platform
    'pending_cash',      -- Waiting for cash payment
    'cash_received',     -- Cash payment confirmed
    'completed',         -- Crypto released to final recipient
    'disputed'           -- Dispute raised
  )),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(trade_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_escrow_trade_id ON public.escrow_transactions(trade_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON public.escrow_transactions(status);
CREATE INDEX IF NOT EXISTS idx_escrow_crypto_sender ON public.escrow_transactions(crypto_sender_id);
CREATE INDEX IF NOT EXISTS idx_escrow_cash_receiver ON public.escrow_transactions(cash_receiver_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_escrow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_escrow_transactions_updated_at ON public.escrow_transactions;
CREATE TRIGGER update_escrow_transactions_updated_at
    BEFORE UPDATE ON public.escrow_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_escrow_updated_at();

-- Enable RLS
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view escrow for their trades" ON public.escrow_transactions;
CREATE POLICY "Users can view escrow for their trades" ON public.escrow_transactions
    FOR SELECT USING (
        auth.uid() = crypto_sender_id OR 
        auth.uid() = crypto_receiver_id OR 
        auth.uid() = cash_sender_id OR 
        auth.uid() = cash_receiver_id
    );

DROP POLICY IF EXISTS "Users can insert escrow for their trades" ON public.escrow_transactions;
CREATE POLICY "Users can insert escrow for their trades" ON public.escrow_transactions
    FOR INSERT WITH CHECK (
        auth.uid() = crypto_sender_id OR 
        auth.uid() = crypto_receiver_id OR 
        auth.uid() = cash_sender_id OR 
        auth.uid() = cash_receiver_id
    );

DROP POLICY IF EXISTS "Users can update escrow for their trades" ON public.escrow_transactions;
CREATE POLICY "Users can update escrow for their trades" ON public.escrow_transactions
    FOR UPDATE USING (
        auth.uid() = crypto_sender_id OR 
        auth.uid() = crypto_receiver_id OR 
        auth.uid() = cash_sender_id OR 
        auth.uid() = cash_receiver_id
    );

-- Add escrow_status column to trades table if it doesn't exist
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS escrow_status TEXT DEFAULT 'pending' 
    CHECK (escrow_status IN ('pending', 'crypto_received', 'cash_received', 'completed', 'disputed'));

-- Create index for escrow_status
CREATE INDEX IF NOT EXISTS idx_trades_escrow_status ON public.trades(escrow_status);
