-- Add indexes for better performance on cash_trades queries
CREATE INDEX IF NOT EXISTS idx_cash_trades_seller_id_created_at ON public.cash_trades(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cash_trades_vendor_id ON public.cash_trades(vendor_id);

-- Add indexes for vendors table
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON public.vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_active ON public.vendors(active) WHERE active = true;