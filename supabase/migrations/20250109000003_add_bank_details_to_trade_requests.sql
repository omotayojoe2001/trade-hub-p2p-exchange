-- Add bank account details to trade_requests table
ALTER TABLE public.trade_requests 
ADD COLUMN user_bank_name TEXT,
ADD COLUMN user_account_number TEXT,
ADD COLUMN user_account_name TEXT;

-- Add comments
COMMENT ON COLUMN public.trade_requests.user_bank_name IS 'Bank name where user wants to receive cash';
COMMENT ON COLUMN public.trade_requests.user_account_number IS 'Account number where user wants to receive cash';
COMMENT ON COLUMN public.trade_requests.user_account_name IS 'Account name where user wants to receive cash';