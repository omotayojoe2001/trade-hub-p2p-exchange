-- Safe creation of trade_requests and trades tables
-- This script handles existing tables and adds missing columns/constraints

-- Step 1: Create trade_requests table
CREATE TABLE IF NOT EXISTS public.trade_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  coin_type TEXT NOT NULL CHECK (coin_type IN ('BTC', 'ETH', 'USDT')),
  amount NUMERIC(20,8) NOT NULL,
  naira_amount NUMERIC(15,2) NOT NULL,
  rate NUMERIC(15,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'cancelled', 'expired')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours')
);

-- Step 2: Clean up invalid data before adding foreign key constraint
DELETE FROM public.trade_requests
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Step 2b: Add foreign key constraint to trade_requests if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'trade_requests_user_id_fkey'
        AND table_name = 'trade_requests'
    ) THEN
        ALTER TABLE public.trade_requests
        ADD CONSTRAINT trade_requests_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 3: Create indexes for trade_requests
CREATE INDEX IF NOT EXISTS idx_trade_requests_user_id ON public.trade_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_requests_status ON public.trade_requests(status);
CREATE INDEX IF NOT EXISTS idx_trade_requests_trade_type ON public.trade_requests(trade_type);
CREATE INDEX IF NOT EXISTS idx_trade_requests_coin_type ON public.trade_requests(coin_type);
CREATE INDEX IF NOT EXISTS idx_trade_requests_created_at ON public.trade_requests(created_at);

-- Step 4: Create updated_at trigger for trade_requests
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

-- Step 5: Enable RLS for trade_requests
ALTER TABLE public.trade_requests ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for trade_requests
DROP POLICY IF EXISTS "Users can view all open trade requests" ON public.trade_requests;
CREATE POLICY "Users can view all open trade requests" ON public.trade_requests
    FOR SELECT USING (status = 'open' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own trade requests" ON public.trade_requests;
CREATE POLICY "Users can insert their own trade requests" ON public.trade_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own trade requests" ON public.trade_requests;
CREATE POLICY "Users can update their own trade requests" ON public.trade_requests
    FOR UPDATE USING (auth.uid() = user_id);

-- Step 7: Add trade_request_id column to trades table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trades' 
        AND column_name = 'trade_request_id'
    ) THEN
        ALTER TABLE public.trades ADD COLUMN trade_request_id UUID;
    END IF;
END $$;

-- Step 8: Add escrow_status column to trades table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trades' 
        AND column_name = 'escrow_status'
    ) THEN
        ALTER TABLE public.trades ADD COLUMN escrow_status TEXT DEFAULT 'pending' 
        CHECK (escrow_status IN ('pending', 'crypto_received', 'cash_received', 'completed', 'disputed'));
    END IF;
END $$;

-- Step 9: Add foreign key constraint from trades to trade_requests
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_trades_trade_request_id' 
        AND table_name = 'trades'
    ) THEN
        ALTER TABLE public.trades 
        ADD CONSTRAINT fk_trades_trade_request_id 
        FOREIGN KEY (trade_request_id) REFERENCES public.trade_requests(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Step 10: Create additional indexes for trades table
CREATE INDEX IF NOT EXISTS idx_trades_trade_request_id ON public.trades(trade_request_id);
CREATE INDEX IF NOT EXISTS idx_trades_escrow_status ON public.trades(escrow_status);

-- Step 11: Verify tables exist
DO $$
BEGIN
    -- Check if trade_requests table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trade_requests') THEN
        RAISE NOTICE 'trade_requests table created successfully';
    ELSE
        RAISE EXCEPTION 'Failed to create trade_requests table';
    END IF;
    
    -- Check if trades table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trades') THEN
        RAISE NOTICE 'trades table updated successfully';
    ELSE
        RAISE NOTICE 'trades table does not exist - this is OK if you have not created it yet';
    END IF;
END $$;
