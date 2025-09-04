-- Fix merchant_settings table schema to match the component requirements

-- Add missing columns to merchant_settings table
ALTER TABLE public.merchant_settings 
ADD COLUMN IF NOT EXISTS supported_coins TEXT[] DEFAULT ARRAY['BTC', 'USDT'],
ADD COLUMN IF NOT EXISTS supported_currencies TEXT[] DEFAULT ARRAY['NGN'],
ADD COLUMN IF NOT EXISTS exchange_rates JSONB DEFAULT '{
  "BTC": {"buy_rate": null, "sell_rate": null},
  "USDT": {"buy_rate": null, "sell_rate": null},
  "ETH": {"buy_rate": null, "sell_rate": null}
}'::jsonb,
ADD COLUMN IF NOT EXISTS service_locations TEXT[] DEFAULT ARRAY['Nigeria'],
ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{
  "enabled": false,
  "monday": {"start": "09:00", "end": "17:00", "enabled": true},
  "tuesday": {"start": "09:00", "end": "17:00", "enabled": true},
  "wednesday": {"start": "09:00", "end": "17:00", "enabled": true},
  "thursday": {"start": "09:00", "end": "17:00", "enabled": true},
  "friday": {"start": "09:00", "end": "17:00", "enabled": true},
  "saturday": {"start": "10:00", "end": "15:00", "enabled": false},
  "sunday": {"start": "10:00", "end": "15:00", "enabled": false}
}'::jsonb,
ADD COLUMN IF NOT EXISTS requires_kyc BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS min_customer_rating NUMERIC DEFAULT 0;

-- Add ETH rates to existing columns
ALTER TABLE public.merchant_settings 
ADD COLUMN IF NOT EXISTS eth_buy_rate NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS eth_sell_rate NUMERIC(15,2);

-- Update the updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for merchant_settings if it doesn't exist
DROP TRIGGER IF EXISTS update_merchant_settings_updated_at ON public.merchant_settings;
CREATE TRIGGER update_merchant_settings_updated_at
    BEFORE UPDATE ON public.merchant_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_merchant_settings_user_id ON public.merchant_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_settings_is_online ON public.merchant_settings(is_online);

-- Enable RLS
ALTER TABLE public.merchant_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own merchant settings" ON public.merchant_settings;
CREATE POLICY "Users can view their own merchant settings" ON public.merchant_settings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own merchant settings" ON public.merchant_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own merchant settings" ON public.merchant_settings
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own merchant settings" ON public.merchant_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Allow public read access for merchant discovery
DROP POLICY IF EXISTS "Public can view online merchant settings" ON public.merchant_settings;
CREATE POLICY "Public can view online merchant settings" ON public.merchant_settings
    FOR SELECT USING (is_online = true AND accepts_new_trades = true);
