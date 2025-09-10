-- Create function to get merchant payment method (bypasses RLS for trade purposes)
CREATE OR REPLACE FUNCTION get_merchant_payment_method(merchant_id UUID)
RETURNS TABLE (
  account_number TEXT,
  bank_name TEXT,
  account_name TEXT,
  bank_code TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm.account_number,
    pm.bank_name,
    pm.account_name,
    pm.bank_code
  FROM payment_methods pm
  WHERE pm.user_id = merchant_id 
    AND pm.is_default = true 
    AND pm.is_active = true
  LIMIT 1;
  
  -- If no default payment method, get any active one
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      pm.account_number,
      pm.bank_name,
      pm.account_name,
      pm.bank_code
    FROM payment_methods pm
    WHERE pm.user_id = merchant_id 
      AND pm.is_active = true
    LIMIT 1;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_merchant_payment_method(UUID) TO authenticated;