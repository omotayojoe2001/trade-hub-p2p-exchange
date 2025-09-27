-- FIX VENDOR DASHBOARD ISSUES
-- Run this in Supabase SQL Editor

-- 1. Add merchant information to cash_trades table
ALTER TABLE cash_trades 
ADD COLUMN IF NOT EXISTS merchant_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS merchant_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS seller_phone VARCHAR(20);

-- 2. Update existing cash_trades with proper status filtering
-- Fix any tradBes that show as delivered when they shouldn't be
UPDATE cash_trades 
SET status = 'vendor_paid' 
WHERE status = 'cash_delivered' 
AND created_at > NOW() - INTERVAL '24 hours'
AND vendor_id IS NOT NULL;

-- 3. Create function to get merchant details for cash trades
CREATE OR REPLACE FUNCTION get_merchant_details_for_trade(trade_request_id UUID)
RETURNS TABLE(merchant_name TEXT, merchant_phone TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(up.full_name, 'Merchant') as merchant_name,
    COALESCE(up.phone, 'Not provided') as merchant_phone
  FROM trade_requests tr
  LEFT JOIN user_profiles up ON up.user_id = tr.buyer_id
  WHERE tr.id = trade_request_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Create function to get seller details for cash trades  
CREATE OR REPLACE FUNCTION get_seller_details_for_trade(trade_request_id UUID)
RETURNS TABLE(seller_name TEXT, seller_phone TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(up.full_name, 'Customer') as seller_name,
    COALESCE(up.phone, 'Not provided') as seller_phone
  FROM trade_requests tr
  LEFT JOIN user_profiles up ON up.user_id = tr.seller_id
  WHERE tr.id = trade_request_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Update notification trigger to include merchant details
CREATE OR REPLACE FUNCTION notify_vendor_payment()
RETURNS TRIGGER AS $$
DECLARE
  merchant_info RECORD;
  seller_info RECORD;
BEGIN
  IF NEW.status = 'vendor_paid' AND (OLD.status IS NULL OR OLD.status != 'vendor_paid') THEN
    -- Get merchant details
    SELECT * INTO merchant_info FROM get_merchant_details_for_trade(NEW.trade_request_id);
    SELECT * INTO seller_info FROM get_seller_details_for_trade(NEW.trade_request_id);
    
    -- Update the cash trade with merchant and seller info
    UPDATE cash_trades 
    SET 
      merchant_name = merchant_info.merchant_name,
      merchant_phone = merchant_info.merchant_phone,
      seller_phone = seller_info.seller_phone
    WHERE id = NEW.id;
    
    -- Send notification to vendor
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
      'Merchant ' || merchant_info.merchant_name || ' paid you $' || NEW.usd_amount || ' USD. Customer is waiting!',
      jsonb_build_object(
        'cash_trade_id', NEW.id,
        'usd_amount', NEW.usd_amount,
        'delivery_code', NEW.delivery_code,
        'customer_phone', seller_info.seller_phone,
        'merchant_name', merchant_info.merchant_name,
        'merchant_phone', merchant_info.merchant_phone,
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

-- 6. Create view for vendor dashboard with proper filtering
CREATE OR REPLACE VIEW vendor_dashboard_trades AS
SELECT 
  ct.*,
  COALESCE(ct.merchant_name, 'Merchant') as merchant_display_name,
  COALESCE(ct.merchant_phone, 'Not provided') as merchant_display_phone,
  COALESCE(ct.seller_phone, 'Not provided') as customer_display_phone,
  CASE 
    WHEN ct.status = 'vendor_paid' THEN 'Ready for Delivery'
    WHEN ct.status = 'delivery_in_progress' THEN 'In Progress'  
    WHEN ct.status = 'cash_delivered' THEN 'Delivered'
    ELSE ct.status
  END as display_status,
  CASE 
    WHEN ct.created_at::date = CURRENT_DATE THEN true
    ELSE false
  END as is_today
FROM cash_trades ct
WHERE ct.status IN ('vendor_paid', 'delivery_in_progress', 'cash_delivered')
ORDER BY ct.created_at DESC;

-- 7. Grant permissions
GRANT SELECT ON vendor_dashboard_trades TO authenticated;

SELECT 'Vendor dashboard fixes applied successfully!' as status;