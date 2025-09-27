-- Create function to get user bank account details for trades (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_bank_account_for_trade(bank_account_id UUID)
RETURNS TABLE (
  account_name TEXT,
  bank_name TEXT,
  account_number TEXT,
  bank_code TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uba.account_name,
    uba.bank_name,
    uba.account_number,
    uba.bank_code
  FROM user_bank_accounts uba
  WHERE uba.id = bank_account_id
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_bank_account_for_trade(UUID) TO authenticated;