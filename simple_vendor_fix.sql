-- SIMPLE VENDOR FIX - NO COMPLEX FUNCTIONS
-- Run this in Supabase SQL Editor

-- 1. Drop any existing broken functions and triggers
DROP TRIGGER IF EXISTS trigger_notify_vendor_payment ON cash_trades;
DROP FUNCTION IF EXISTS notify_vendor_payment();
DROP FUNCTION IF EXISTS get_merchant_details_for_trade(UUID);
DROP FUNCTION IF EXISTS get_seller_details_for_trade(UUID);

-- 2. Add columns to cash_trades
ALTER TABLE cash_trades 
ADD COLUMN IF NOT EXISTS merchant_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS merchant_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS seller_phone VARCHAR(20);

-- 3. Update all existing cash trades to vendor_paid status so vendors can see them
UPDATE cash_trades 
SET status = 'vendor_paid'
WHERE vendor_id IS NOT NULL 
AND status NOT IN ('cash_delivered', 'completed');

-- 4. Update existing trades with basic info
UPDATE cash_trades 
SET 
  merchant_name = 'Merchant',
  merchant_phone = 'Not provided',
  seller_phone = 'Not provided'
WHERE vendor_id IS NOT NULL
AND merchant_name IS NULL;

-- 5. Create simple notification trigger without complex lookups
CREATE OR REPLACE FUNCTION notify_vendor_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'vendor_paid' AND (OLD.status IS NULL OR OLD.status != 'vendor_paid') THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data,
      read
    )
    SELECT 
      v.user_id,
      'vendor_payment_received',
      '💰 PAYMENT RECEIVED!',
      'You received $' || NEW.usd_amount || ' USD payment. Customer is waiting for delivery!',
      jsonb_build_object(
        'cash_trade_id', NEW.id,
        'usd_amount', NEW.usd_amount,
        'delivery_code', NEW.delivery_code,
        'delivery_address', NEW.delivery_address,
        'delivery_type', NEW.delivery_type,
        'priority', 'high'
      ),
      false
    FROM vendors v 
    WHERE v.id = NEW.vendor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_vendor_payment
  AFTER UPDATE ON cash_trades
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_payment();

SELECT 'Simple vendor fix applied - vendors should see deliveries now!' as status;