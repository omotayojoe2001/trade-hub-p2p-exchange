-- VENDOR NAIRA PAYMENT CONFIRMATION AND CUSTOMER DETAILS FIX
-- Run this in Supabase SQL Editor

-- 1. Add customer details, naira amount and payment confirmation columns to cash_trades
ALTER TABLE cash_trades 
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS customer_full_address TEXT,
ADD COLUMN IF NOT EXISTS naira_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS payment_confirmed_by_vendor BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS vendor_payment_confirmed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS crypto_released_to_merchant BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS crypto_released_at TIMESTAMP;

-- 2. Update existing cash trades with customer details from user_profiles
UPDATE cash_trades ct
SET 
  customer_name = COALESCE(up.full_name, 'Customer'),
  customer_phone = COALESCE(up.phone, 'Not provided'),
  seller_phone = COALESCE(up.phone, 'Not provided'),
  customer_full_address = COALESCE(ct.delivery_address, 'Address not provided'),
  naira_amount = ct.usd_amount * 1650 -- Approximate USD to NGN conversion
FROM user_profiles up
WHERE ct.seller_id = up.user_id
AND ct.vendor_id IS NOT NULL
AND ct.customer_name IS NULL;

-- 3. Update status flow - add new statuses
-- vendor_paid -> payment_confirmed -> delivery_in_progress -> cash_delivered -> completed

-- 4. Create function to handle vendor payment confirmation
CREATE OR REPLACE FUNCTION confirm_vendor_payment(cash_trade_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update cash trade to confirm payment received
  UPDATE cash_trades 
  SET 
    payment_confirmed_by_vendor = TRUE,
    vendor_payment_confirmed_at = NOW(),
    status = 'payment_confirmed',
    crypto_released_to_merchant = TRUE,
    crypto_released_at = NOW()
  WHERE id = cash_trade_id
  AND status = 'vendor_paid';
  
  -- Notify merchant that crypto has been released
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    read
  )
  SELECT 
    ct.buyer_id,
    'crypto_released',
    '🚀 Crypto Released!',
    'Vendor confirmed payment. Your crypto has been released from escrow.',
    jsonb_build_object(
      'cash_trade_id', cash_trade_id,
      'status', 'crypto_released'
    ),
    false
  FROM cash_trades ct
  WHERE ct.id = cash_trade_id
  AND ct.buyer_id IS NOT NULL;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to start delivery process
CREATE OR REPLACE FUNCTION start_delivery_process(cash_trade_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update status to delivery in progress
  UPDATE cash_trades 
  SET status = 'delivery_in_progress'
  WHERE id = cash_trade_id
  AND status = 'payment_confirmed';
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION confirm_vendor_payment(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION start_delivery_process(UUID) TO authenticated;

SELECT 'Vendor payment confirmation system created!' as status;