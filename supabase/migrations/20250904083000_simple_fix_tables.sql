-- Simple fix for missing tables - create only what's needed

-- 1. Create payment_methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'bank_account',
    account_name VARCHAR(255),
    account_number VARCHAR(50),
    bank_name VARCHAR(255),
    bank_code VARCHAR(20),
    country VARCHAR(5) DEFAULT 'NG',
    is_default BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create merchant_settings table
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
    btc_buy_rate DECIMAL(20,8) DEFAULT 0,
    btc_sell_rate DECIMAL(20,8) DEFAULT 0,
    eth_buy_rate DECIMAL(20,8) DEFAULT 0,
    eth_sell_rate DECIMAL(20,8) DEFAULT 0,
    usdt_buy_rate DECIMAL(20,8) DEFAULT 0,
    usdt_sell_rate DECIMAL(20,8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Add missing columns to trade_requests
ALTER TABLE public.trade_requests ADD COLUMN IF NOT EXISTS coin_type VARCHAR(10);
ALTER TABLE public.trade_requests ADD COLUMN IF NOT EXISTS trade_type VARCHAR(20);
ALTER TABLE public.trade_requests ADD COLUMN IF NOT EXISTS naira_amount DECIMAL(20,2);
ALTER TABLE public.trade_requests ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'bank_transfer';

-- 4. Update existing data
UPDATE public.trade_requests SET coin_type = crypto_type WHERE coin_type IS NULL AND crypto_type IS NOT NULL;
UPDATE public.trade_requests SET naira_amount = cash_amount WHERE naira_amount IS NULL AND cash_amount IS NOT NULL;
UPDATE public.trade_requests SET 
    trade_type = CASE 
        WHEN direction = 'crypto_to_cash' THEN 'sell'
        WHEN direction = 'cash_to_crypto' THEN 'buy'
        ELSE 'sell'
    END
WHERE trade_type IS NULL;

-- 5. Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_settings ENABLE ROW LEVEL SECURITY;

-- 6. Create basic RLS policies
CREATE POLICY "payment_methods_policy" ON public.payment_methods FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "merchant_settings_select_policy" ON public.merchant_settings FOR SELECT USING (true);
CREATE POLICY "merchant_settings_modify_policy" ON public.merchant_settings FOR ALL USING (auth.uid() = user_id);

-- 7. Create update triggers
CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_merchant_settings_updated_at
    BEFORE UPDATE ON public.merchant_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
