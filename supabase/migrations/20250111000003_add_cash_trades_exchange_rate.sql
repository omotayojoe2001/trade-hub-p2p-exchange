-- Add exchange rate column to cash_trades table
ALTER TABLE public.cash_trades 
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL DEFAULT NULL;

-- Add cash_trade_id column to cash_order_tracking table
ALTER TABLE public.cash_order_tracking 
ADD COLUMN IF NOT EXISTS cash_trade_id UUID REFERENCES public.cash_trades(id);