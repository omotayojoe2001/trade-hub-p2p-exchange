-- Add USD to Naira exchange rate for vendors
ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS usd_to_naira_rate DECIMAL DEFAULT NULL;