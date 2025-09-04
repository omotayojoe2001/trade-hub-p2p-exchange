-- Create trade_requests table for P2P trading

CREATE TABLE IF NOT EXISTS public.trade_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Trade details
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  coin_type TEXT NOT NULL CHECK (coin_type IN ('BTC', 'ETH', 'USDT')),
  amount NUMERIC(20,8) NOT NULL,
  naira_amount NUMERIC(15,2) NOT NULL,
  rate NUMERIC(15,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  
  -- Status and metadata
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'cancelled', 'expired')),
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trade_requests_user_id ON public.trade_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_requests_status ON public.trade_requests(status);
CREATE INDEX IF NOT EXISTS idx_trade_requests_trade_type ON public.trade_requests(trade_type);
CREATE INDEX IF NOT EXISTS idx_trade_requests_coin_type ON public.trade_requests(coin_type);
CREATE INDEX IF NOT EXISTS idx_trade_requests_created_at ON public.trade_requests(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_trade_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_trade_requests_updated_at ON public.trade_requests;
CREATE TRIGGER update_trade_requests_updated_at
    BEFORE UPDATE ON public.trade_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_trade_requests_updated_at();

-- Enable RLS
ALTER TABLE public.trade_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view all open trade requests" ON public.trade_requests;
CREATE POLICY "Users can view all open trade requests" ON public.trade_requests
    FOR SELECT USING (status = 'open' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own trade requests" ON public.trade_requests;
CREATE POLICY "Users can insert their own trade requests" ON public.trade_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own trade requests" ON public.trade_requests;
CREATE POLICY "Users can update their own trade requests" ON public.trade_requests
    FOR UPDATE USING (auth.uid() = user_id);

-- Create trades table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_request_id UUID,
  
  -- Participants
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Trade details (copied from trade_request)
  coin_type TEXT NOT NULL,
  amount NUMERIC(20,8) NOT NULL,
  naira_amount NUMERIC(15,2) NOT NULL,
  rate NUMERIC(15,2) NOT NULL,
  payment_method TEXT NOT NULL,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'disputed')),
  escrow_status TEXT DEFAULT 'pending' CHECK (escrow_status IN ('pending', 'crypto_received', 'cash_received', 'completed', 'disputed')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for trades table
CREATE INDEX IF NOT EXISTS idx_trades_trade_request_id ON public.trades(trade_request_id);
CREATE INDEX IF NOT EXISTS idx_trades_buyer_id ON public.trades(buyer_id);
CREATE INDEX IF NOT EXISTS idx_trades_seller_id ON public.trades(seller_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_escrow_status ON public.trades(escrow_status);

-- Enable RLS for trades
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for trades
DROP POLICY IF EXISTS "Users can view their own trades" ON public.trades;
CREATE POLICY "Users can view their own trades" ON public.trades
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can insert trades" ON public.trades;
CREATE POLICY "Users can insert trades" ON public.trades
    FOR INSERT WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can update their own trades" ON public.trades;
CREATE POLICY "Users can update their own trades" ON public.trades
    FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Create updated_at trigger for trades
CREATE OR REPLACE FUNCTION update_trades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_trades_updated_at ON public.trades;
CREATE TRIGGER update_trades_updated_at
    BEFORE UPDATE ON public.trades
    FOR EACH ROW
    EXECUTE FUNCTION update_trades_updated_at();

-- Add foreign key constraint after both tables exist
ALTER TABLE public.trades
ADD CONSTRAINT fk_trades_trade_request_id
FOREIGN KEY (trade_request_id) REFERENCES public.trade_requests(id) ON DELETE CASCADE;
