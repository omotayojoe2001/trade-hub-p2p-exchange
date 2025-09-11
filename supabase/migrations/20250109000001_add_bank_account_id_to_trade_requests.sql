-- Add bank_account_id column to trade_requests table for sell crypto flow

-- Add the bank_account_id column to store which bank account the user wants to receive cash
ALTER TABLE public.trade_requests 
ADD COLUMN bank_account_id UUID REFERENCES public.user_bank_accounts(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_trade_requests_bank_account_id ON public.trade_requests(bank_account_id);

-- Add comment to explain the column
COMMENT ON COLUMN public.trade_requests.bank_account_id IS 'Bank account where user wants to receive cash (for sell trades)';