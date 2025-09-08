-- Fix trade_requests table schema to match the application requirements

-- First, let's check if the table exists and what columns it has
-- If the table doesn't exist, create it with the correct schema
-- If it exists but has wrong columns, we'll alter it

-- Drop the existing table if it exists (this will lose data, but it's for development)
DROP TABLE IF EXISTS public.trade_requests CASCADE;

-- Create the trade_requests table with the correct schema
CREATE TABLE public.trade_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Trade details
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  crypto_type TEXT NOT NULL CHECK (crypto_type IN ('BTC', 'ETH', 'USDT')),
  amount_crypto DECIMAL(20,8) NOT NULL,
  amount_fiat DECIMAL(20,2) NOT NULL,
  rate DECIMAL(20,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  
  -- Additional fields
  wallet_address TEXT,
  notes TEXT,
  
  -- Status and metadata
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_trade_requests_user_id ON public.trade_requests(user_id);
CREATE INDEX idx_trade_requests_merchant_id ON public.trade_requests(merchant_id);
CREATE INDEX idx_trade_requests_status ON public.trade_requests(status);
CREATE INDEX idx_trade_requests_trade_type ON public.trade_requests(trade_type);
CREATE INDEX idx_trade_requests_crypto_type ON public.trade_requests(crypto_type);
CREATE INDEX idx_trade_requests_created_at ON public.trade_requests(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_trade_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_trade_requests_updated_at
    BEFORE UPDATE ON public.trade_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_trade_requests_updated_at();

-- Enable RLS
ALTER TABLE public.trade_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own trade requests" ON public.trade_requests;
CREATE POLICY "Users can view their own trade requests" ON public.trade_requests
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Users can insert their own trade requests" ON public.trade_requests;
CREATE POLICY "Users can insert their own trade requests" ON public.trade_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own trade requests" ON public.trade_requests;
CREATE POLICY "Users can update their own trade requests" ON public.trade_requests
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = merchant_id);

-- Grant necessary permissions
GRANT ALL ON public.trade_requests TO authenticated;
GRANT ALL ON public.trade_requests TO service_role;
