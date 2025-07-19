-- Create merchant_settings table for rate and configuration management
CREATE TABLE public.merchant_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_type text NOT NULL DEFAULT 'manual' CHECK (merchant_type IN ('auto', 'manual')),
  
  -- Exchange rates (in NGN per crypto unit)
  btc_buy_rate numeric(15,2), -- Rate when merchant buys BTC from customers
  btc_sell_rate numeric(15,2), -- Rate when merchant sells BTC to customers
  usdt_buy_rate numeric(15,2),
  usdt_sell_rate numeric(15,2),
  
  -- Trading limits
  min_trade_amount numeric(15,2) DEFAULT 1000,
  max_trade_amount numeric(15,2) DEFAULT 10000000,
  
  -- Auto-trading settings
  auto_accept_trades boolean DEFAULT false,
  auto_release_escrow boolean DEFAULT false,
  
  -- Merchant status
  is_online boolean DEFAULT true,
  accepts_new_trades boolean DEFAULT true,
  
  -- Response times
  avg_response_time_minutes integer DEFAULT 10,
  
  -- Payment methods
  payment_methods jsonb DEFAULT '["bank_transfer"]'::jsonb,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Create merchant_ratings table for customer reviews
CREATE TABLE public.merchant_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id uuid NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5),
  speed_rating integer CHECK (speed_rating >= 1 AND speed_rating <= 5),
  reliability_rating integer CHECK (reliability_rating >= 1 AND reliability_rating <= 5),
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  UNIQUE(trade_id, customer_id)
);

-- Create crypto_wallets table for escrow management
CREATE TABLE public.crypto_wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_type text NOT NULL CHECK (coin_type IN ('BTC', 'USDT', 'ETH')),
  
  -- Wallet addresses
  deposit_address text NOT NULL,
  private_key_encrypted text, -- For escrow wallets only
  
  -- Balance tracking
  available_balance numeric(20,8) DEFAULT 0,
  escrow_balance numeric(20,8) DEFAULT 0,
  
  -- Wallet type
  wallet_type text NOT NULL DEFAULT 'user' CHECK (wallet_type IN ('user', 'escrow', 'platform')),
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, coin_type, wallet_type)
);

-- Create escrow_transactions table for tracking crypto in escrow
CREATE TABLE public.escrow_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id uuid NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  
  -- Crypto details
  coin_type text NOT NULL,
  amount numeric(20,8) NOT NULL,
  escrow_address text NOT NULL,
  
  -- Transaction hashes
  deposit_tx_hash text,
  release_tx_hash text,
  
  -- Status tracking
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'deposited', 'released', 'refunded')),
  
  -- Timestamps
  deposit_confirmed_at timestamp with time zone,
  release_confirmed_at timestamp with time zone,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.merchant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for merchant_settings
CREATE POLICY "Users can view and update their own merchant settings" 
ON public.merchant_settings 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create policies for merchant_ratings
CREATE POLICY "Users can view ratings for their trades" 
ON public.merchant_ratings 
FOR SELECT 
USING (auth.uid() = merchant_id OR auth.uid() = customer_id);

CREATE POLICY "Customers can create ratings after trades" 
ON public.merchant_ratings 
FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

-- Create policies for crypto_wallets
CREATE POLICY "Users can manage their own wallets" 
ON public.crypto_wallets 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create policies for escrow_transactions
CREATE POLICY "Users can view escrow for their trades" 
ON public.escrow_transactions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM trades 
  WHERE trades.id = escrow_transactions.trade_id 
  AND (trades.buyer_id = auth.uid() OR trades.seller_id = auth.uid())
));

-- Create trigger for updating merchant_settings updated_at
CREATE TRIGGER update_merchant_settings_updated_at
BEFORE UPDATE ON public.merchant_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updating crypto_wallets updated_at
CREATE TRIGGER update_crypto_wallets_updated_at
BEFORE UPDATE ON public.crypto_wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updating escrow_transactions updated_at
CREATE TRIGGER update_escrow_transactions_updated_at
BEFORE UPDATE ON public.escrow_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();