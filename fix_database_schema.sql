-- Fix database schema for trade requests and related tables

-- 1. Fix trade_requests table
-- First, check if the table exists and what columns it has
DO $$
BEGIN
    -- Check if trade_requests table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trade_requests' AND table_schema = 'public') THEN
        -- Table exists, check if merchant_id column exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trade_requests' AND column_name = 'merchant_id' AND table_schema = 'public') THEN
            -- Add missing columns
            ALTER TABLE public.trade_requests ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            ALTER TABLE public.trade_requests ADD COLUMN IF NOT EXISTS crypto_type TEXT;
            ALTER TABLE public.trade_requests ADD COLUMN IF NOT EXISTS amount_crypto DECIMAL(20,8);
            ALTER TABLE public.trade_requests ADD COLUMN IF NOT EXISTS amount_fiat DECIMAL(20,2);
            ALTER TABLE public.trade_requests ADD COLUMN IF NOT EXISTS wallet_address TEXT;
            
            -- Update existing records to have proper values
            UPDATE public.trade_requests 
            SET crypto_type = coin_type,
                amount_crypto = amount,
                amount_fiat = naira_amount
            WHERE crypto_type IS NULL;
        END IF;
    ELSE
        -- Table doesn't exist, create it
        CREATE TABLE public.trade_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
            crypto_type TEXT NOT NULL CHECK (crypto_type IN ('BTC', 'ETH', 'USDT')),
            amount_crypto DECIMAL(20,8) NOT NULL,
            amount_fiat DECIMAL(20,2) NOT NULL,
            rate DECIMAL(20,2) NOT NULL,
            payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
            wallet_address TEXT,
            notes TEXT,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours'),
            accepted_at TIMESTAMP WITH TIME ZONE,
            completed_at TIMESTAMP WITH TIME ZONE
        );
    END IF;
END $$;

-- 2. Create trades table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_request_id UUID REFERENCES public.trade_requests(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    coin_type TEXT NOT NULL CHECK (coin_type IN ('BTC', 'ETH', 'USDT')),
    amount DECIMAL(20,8) NOT NULL,
    amount_crypto DECIMAL(20,8) NOT NULL,
    amount_fiat DECIMAL(20,2) NOT NULL,
    naira_amount DECIMAL(20,2) NOT NULL,
    rate DECIMAL(20,2) NOT NULL,
    platform_fee_amount DECIMAL(20,2) DEFAULT 0,
    net_amount DECIMAL(20,2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
    payment_proof_url TEXT,
    escrow_status TEXT DEFAULT 'pending' CHECK (escrow_status IN ('pending', 'crypto_deposited', 'payment_sent', 'completed', 'disputed')),
    escrow_vault_id TEXT,
    escrow_address TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'crypto_deposited', 'payment_sent', 'completed', 'cancelled', 'disputed')),
    trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Create payment_methods table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_number TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    account_name TEXT NOT NULL,
    bank_code TEXT,
    method_type TEXT NOT NULL DEFAULT 'bank_transfer' CHECK (method_type IN ('bank_transfer', 'cash', 'mobile_money')),
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_trade_requests_user_id ON public.trade_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_requests_merchant_id ON public.trade_requests(merchant_id);
CREATE INDEX IF NOT EXISTS idx_trade_requests_status ON public.trade_requests(status);
CREATE INDEX IF NOT EXISTS idx_trades_buyer_id ON public.trades(buyer_id);
CREATE INDEX IF NOT EXISTS idx_trades_seller_id ON public.trades(seller_id);
CREATE INDEX IF NOT EXISTS idx_trades_trade_request_id ON public.trades(trade_request_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);

-- 5. Enable RLS and create policies
ALTER TABLE public.trade_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own trade requests" ON public.trade_requests;
DROP POLICY IF EXISTS "Users can insert their own trade requests" ON public.trade_requests;
DROP POLICY IF EXISTS "Users can update their own trade requests" ON public.trade_requests;
DROP POLICY IF EXISTS "Users can view their own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can insert trades" ON public.trades;
DROP POLICY IF EXISTS "Users can update their own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can view their own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can insert their own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can update their own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can delete their own payment methods" ON public.payment_methods;

-- Create new policies
CREATE POLICY "Users can view their own trade requests" ON public.trade_requests
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = merchant_id);

CREATE POLICY "Users can insert their own trade requests" ON public.trade_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trade requests" ON public.trade_requests
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = merchant_id);

CREATE POLICY "Users can view their own trades" ON public.trades
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can insert trades" ON public.trades
    FOR INSERT WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can update their own trades" ON public.trades
    FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can view their own payment methods" ON public.payment_methods
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment methods" ON public.payment_methods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods" ON public.payment_methods
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods" ON public.payment_methods
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Grant permissions
GRANT ALL ON public.trade_requests TO authenticated;
GRANT ALL ON public.trade_requests TO service_role;
GRANT ALL ON public.trades TO authenticated;
GRANT ALL ON public.trades TO service_role;
GRANT ALL ON public.payment_methods TO authenticated;
GRANT ALL ON public.payment_methods TO service_role;