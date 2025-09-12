-- Create escrow addresses table for BitGo integration
CREATE TABLE IF NOT EXISTS public.escrow_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id TEXT NOT NULL,
  coin TEXT NOT NULL,
  address TEXT NOT NULL,
  wallet_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  tx_hash TEXT,
  amount DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  released_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_escrow_addresses_trade_id ON public.escrow_addresses(trade_id);
CREATE INDEX IF NOT EXISTS idx_escrow_addresses_address ON public.escrow_addresses(address);
CREATE INDEX IF NOT EXISTS idx_escrow_addresses_status ON public.escrow_addresses(status);

-- Enable RLS
ALTER TABLE public.escrow_addresses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view escrow addresses" ON public.escrow_addresses FOR SELECT USING (true);
CREATE POLICY "System can manage escrow addresses" ON public.escrow_addresses FOR ALL USING (true);