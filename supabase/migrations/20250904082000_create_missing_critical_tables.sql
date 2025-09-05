-- Create all missing critical tables for the P2P trading platform

-- 1. Create payment_methods table (if not exists)
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('bank_account', 'mobile_money', 'crypto_wallet')),
    account_name VARCHAR(255),
    account_number VARCHAR(50),
    bank_name VARCHAR(255),
    bank_code VARCHAR(20),
    country VARCHAR(5) DEFAULT 'NG',
    is_default BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create merchant_settings table (if not exists)
CREATE TABLE IF NOT EXISTS public.merchant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    is_online BOOLEAN DEFAULT true,
    accepts_new_trades BOOLEAN DEFAULT true,
    auto_accept_trades BOOLEAN DEFAULT false,
    min_trade_amount DECIMAL(20,8) DEFAULT 0,
    max_trade_amount DECIMAL(20,8) DEFAULT 1000000,
    avg_response_time_minutes INTEGER DEFAULT 15,
    payment_methods TEXT[] DEFAULT ARRAY['bank_transfer'],
    operating_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00", "timezone": "Africa/Lagos"}',
    btc_buy_rate DECIMAL(20,8) DEFAULT 0,
    btc_sell_rate DECIMAL(20,8) DEFAULT 0,
    eth_buy_rate DECIMAL(20,8) DEFAULT 0,
    eth_sell_rate DECIMAL(20,8) DEFAULT 0,
    usdt_buy_rate DECIMAL(20,8) DEFAULT 0,
    usdt_sell_rate DECIMAL(20,8) DEFAULT 0,
    trade_completion_rate DECIMAL(5,2) DEFAULT 100.00,
    total_trades_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Fix trade_requests table - add missing coin_type column and fix structure
ALTER TABLE public.trade_requests ADD COLUMN IF NOT EXISTS coin_type VARCHAR(10);

-- Update existing records to use coin_type from crypto_type
UPDATE public.trade_requests SET coin_type = crypto_type WHERE coin_type IS NULL AND crypto_type IS NOT NULL;

-- Add other missing columns to trade_requests
ALTER TABLE public.trade_requests ADD COLUMN IF NOT EXISTS trade_type VARCHAR(20);
ALTER TABLE public.trade_requests ADD COLUMN IF NOT EXISTS naira_amount DECIMAL(20,2);
ALTER TABLE public.trade_requests ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'bank_transfer';
ALTER TABLE public.trade_requests ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Update existing records
UPDATE public.trade_requests SET 
    trade_type = CASE 
        WHEN direction = 'crypto_to_cash' THEN 'sell'
        WHEN direction = 'cash_to_crypto' THEN 'buy'
        ELSE 'sell'
    END
WHERE trade_type IS NULL;

UPDATE public.trade_requests SET naira_amount = cash_amount WHERE naira_amount IS NULL AND cash_amount IS NOT NULL;

-- 4. Enable RLS on all tables
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_settings ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for payment_methods
DROP POLICY IF EXISTS "Users can manage their own payment methods" ON public.payment_methods;
CREATE POLICY "Users can manage their own payment methods"
    ON public.payment_methods FOR ALL
    USING (auth.uid() = user_id);

-- 6. Create RLS policies for merchant_settings
DROP POLICY IF EXISTS "Users can view merchant settings" ON public.merchant_settings;
CREATE POLICY "Users can view merchant settings"
    ON public.merchant_settings FOR SELECT
    USING (true); -- Anyone can view merchant settings

DROP POLICY IF EXISTS "Users can manage their own merchant settings" ON public.merchant_settings;
CREATE POLICY "Users can manage their own merchant settings"
    ON public.merchant_settings FOR ALL
    USING (auth.uid() = user_id);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON payment_methods(type);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(is_default);
CREATE INDEX IF NOT EXISTS idx_merchant_settings_user_id ON merchant_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_settings_is_online ON merchant_settings(is_online);
CREATE INDEX IF NOT EXISTS idx_trade_requests_coin_type ON trade_requests(coin_type);
CREATE INDEX IF NOT EXISTS idx_trade_requests_trade_type ON trade_requests(trade_type);

-- 8. Create update triggers
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_merchant_settings_updated_at ON public.merchant_settings;
CREATE TRIGGER update_merchant_settings_updated_at
    BEFORE UPDATE ON public.merchant_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Enable realtime for all tables
DO $$
BEGIN
    -- Add payment_methods table if not already in publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'payment_methods'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_methods;
    END IF;
    
    -- Add merchant_settings table if not already in publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'merchant_settings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.merchant_settings;
    END IF;
END $$;

-- 10. Insert default merchant settings for existing users who are merchants
INSERT INTO public.merchant_settings (user_id, is_online, accepts_new_trades)
SELECT DISTINCT p.user_id, true, true
FROM public.profiles p
WHERE p.is_merchant = true
AND NOT EXISTS (
    SELECT 1 FROM public.merchant_settings ms 
    WHERE ms.user_id = p.user_id
)
ON CONFLICT (user_id) DO NOTHING;

-- Success message
SELECT 'Critical database tables created successfully!' as message;
