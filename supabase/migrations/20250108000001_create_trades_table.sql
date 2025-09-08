-- Create trades table for the escrow flow

-- Drop the existing table if it exists
DROP TABLE IF EXISTS public.trades CASCADE;

-- Create the trades table
CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_request_id UUID REFERENCES public.trade_requests(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Trade details
  coin_type TEXT NOT NULL CHECK (coin_type IN ('BTC', 'ETH', 'USDT')),
  amount DECIMAL(20,8) NOT NULL,
  amount_crypto DECIMAL(20,8) NOT NULL,
  amount_fiat DECIMAL(20,2) NOT NULL,
  naira_amount DECIMAL(20,2) NOT NULL,
  rate DECIMAL(20,2) NOT NULL,
  platform_fee_amount DECIMAL(20,2) DEFAULT 0,
  net_amount DECIMAL(20,2) NOT NULL,
  
  -- Payment details
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  payment_proof_url TEXT,
  
  -- Escrow details
  escrow_status TEXT DEFAULT 'pending' CHECK (escrow_status IN ('pending', 'crypto_deposited', 'payment_sent', 'completed', 'disputed')),
  escrow_vault_id TEXT,
  escrow_address TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'crypto_deposited', 'payment_sent', 'completed', 'cancelled', 'disputed')),
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_trades_buyer_id ON public.trades(buyer_id);
CREATE INDEX idx_trades_seller_id ON public.trades(seller_id);
CREATE INDEX idx_trades_trade_request_id ON public.trades(trade_request_id);
CREATE INDEX idx_trades_status ON public.trades(status);
CREATE INDEX idx_trades_escrow_status ON public.trades(escrow_status);
CREATE INDEX idx_trades_created_at ON public.trades(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_trades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_trades_updated_at
    BEFORE UPDATE ON public.trades
    FOR EACH ROW
    EXECUTE FUNCTION update_trades_updated_at();

-- Enable RLS
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own trades" ON public.trades;
CREATE POLICY "Users can view their own trades" ON public.trades
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can insert trades" ON public.trades;
CREATE POLICY "Users can insert trades" ON public.trades
    FOR INSERT WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can update their own trades" ON public.trades;
CREATE POLICY "Users can update their own trades" ON public.trades
    FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Grant permissions
GRANT ALL ON public.trades TO authenticated;
GRANT ALL ON public.trades TO service_role;
