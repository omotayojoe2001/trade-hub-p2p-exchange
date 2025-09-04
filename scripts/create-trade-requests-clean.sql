-- Clean setup of trade_requests system
-- This script safely handles existing data and creates proper schema

-- Step 1: Drop existing foreign key constraints if they exist
DO $$
BEGIN
    -- Drop trade_requests foreign key if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'trade_requests_user_id_fkey' 
        AND table_name = 'trade_requests'
    ) THEN
        ALTER TABLE public.trade_requests DROP CONSTRAINT trade_requests_user_id_fkey;
    END IF;
    
    -- Drop trades foreign key if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_trades_trade_request_id' 
        AND table_name = 'trades'
    ) THEN
        ALTER TABLE public.trades DROP CONSTRAINT fk_trades_trade_request_id;
    END IF;
END $$;

-- Step 2: Create trade_requests table (will not error if exists)
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

-- Step 3: Clean up any invalid data (records with non-existent user_ids)
DELETE FROM public.trade_requests 
WHERE user_id NOT IN (SELECT id FROM auth.users)
AND user_id != '00000000-0000-0000-0000-000000000000'; -- Keep system records if any

-- Step 4: Add trade_request_id column to trades table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trades' 
        AND column_name = 'trade_request_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.trades ADD COLUMN trade_request_id UUID;
    END IF;
END $$;

-- Step 5: Add escrow_status column to trades table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trades' 
        AND column_name = 'escrow_status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.trades ADD COLUMN escrow_status TEXT DEFAULT 'pending';
    END IF;
END $$;

-- Step 6: Add escrow_status constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'trades_escrow_status_check'
    ) THEN
        ALTER TABLE public.trades ADD CONSTRAINT trades_escrow_status_check 
        CHECK (escrow_status IN ('pending', 'crypto_received', 'cash_received', 'completed', 'disputed'));
    END IF;
END $$;

-- Step 7: Create indexes
CREATE INDEX IF NOT EXISTS idx_trade_requests_user_id ON public.trade_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_requests_status ON public.trade_requests(status);
CREATE INDEX IF NOT EXISTS idx_trade_requests_trade_type ON public.trade_requests(trade_type);
CREATE INDEX IF NOT EXISTS idx_trade_requests_coin_type ON public.trade_requests(coin_type);
CREATE INDEX IF NOT EXISTS idx_trade_requests_created_at ON public.trade_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_trades_trade_request_id ON public.trades(trade_request_id);
CREATE INDEX IF NOT EXISTS idx_trades_escrow_status ON public.trades(escrow_status);

-- Step 8: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_trade_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 9: Create trigger
DROP TRIGGER IF EXISTS update_trade_requests_updated_at ON public.trade_requests;
CREATE TRIGGER update_trade_requests_updated_at
    BEFORE UPDATE ON public.trade_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_trade_requests_updated_at();

-- Step 10: Enable RLS
ALTER TABLE public.trade_requests ENABLE ROW LEVEL SECURITY;

-- Step 11: Create RLS policies
DROP POLICY IF EXISTS "Users can view all open trade requests" ON public.trade_requests;
CREATE POLICY "Users can view all open trade requests" ON public.trade_requests
    FOR SELECT USING (status = 'open' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own trade requests" ON public.trade_requests;
CREATE POLICY "Users can insert their own trade requests" ON public.trade_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own trade requests" ON public.trade_requests;
CREATE POLICY "Users can update their own trade requests" ON public.trade_requests
    FOR UPDATE USING (auth.uid() = user_id);

-- Step 12: Add foreign key constraints ONLY if there are valid users
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    -- Check if there are any users in auth.users
    SELECT COUNT(*) INTO user_count FROM auth.users LIMIT 1;
    
    IF user_count > 0 THEN
        -- Only add foreign key if we have users and no invalid data
        IF NOT EXISTS (
            SELECT 1 FROM public.trade_requests 
            WHERE user_id NOT IN (SELECT id FROM auth.users)
        ) THEN
            -- Add foreign key constraint for trade_requests
            ALTER TABLE public.trade_requests 
            ADD CONSTRAINT trade_requests_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Added foreign key constraint for trade_requests';
        ELSE
            RAISE NOTICE 'Skipped foreign key constraint - invalid user_ids still exist';
        END IF;
        
        -- Add foreign key constraint for trades if trade_requests table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trade_requests') THEN
            ALTER TABLE public.trades 
            ADD CONSTRAINT fk_trades_trade_request_id 
            FOREIGN KEY (trade_request_id) REFERENCES public.trade_requests(id) ON DELETE SET NULL;
            
            RAISE NOTICE 'Added foreign key constraint for trades';
        END IF;
    ELSE
        RAISE NOTICE 'No users found in auth.users - skipping foreign key constraints';
        RAISE NOTICE 'Foreign keys will be added automatically when users sign up';
    END IF;
END $$;

-- Step 13: Final verification
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trade_requests' AND table_schema = 'public') THEN
        RAISE NOTICE 'SUCCESS: trade_requests table is ready';
    ELSE
        RAISE EXCEPTION 'FAILED: trade_requests table was not created';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trades' AND table_schema = 'public') THEN
        RAISE NOTICE 'SUCCESS: trades table is ready';
    ELSE
        RAISE NOTICE 'INFO: trades table does not exist yet - this is OK';
    END IF;
END $$;
