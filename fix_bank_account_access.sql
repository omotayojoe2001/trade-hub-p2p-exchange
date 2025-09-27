-- Fix bank account access for sell crypto trades
-- Create a function that can access bank accounts for trade purposes

CREATE OR REPLACE FUNCTION get_bank_account_for_sell_crypto(trade_request_id UUID)
RETURNS TABLE (
  account_name TEXT,
  bank_name TEXT,
  account_number TEXT,
  bank_code TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  bank_acc_id UUID;
BEGIN
  -- Get the bank_account_id from trade_requests
  SELECT bank_account_id INTO bank_acc_id
  FROM trade_requests 
  WHERE id = trade_request_id;
  
  -- Return bank account details
  RETURN QUERY
  SELECT 
    uba.account_name,
    uba.bank_name,
    uba.account_number,
    uba.bank_code
  FROM user_bank_accounts uba
  WHERE uba.id = bank_acc_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_bank_account_for_sell_crypto(UUID) TO authenticated;

-- Also create a policy that allows merchants to view bank accounts for their accepted trades
CREATE POLICY "Merchants can view bank accounts for accepted trades" ON user_bank_accounts
FOR SELECT USING (
  id IN (
    SELECT bank_account_id 
    FROM trade_requests 
    WHERE merchant_id = auth.uid() 
    AND status IN ('accepted', 'payment_sent', 'completed')
  )
);