-- COMPLETE CASH DELIVERY SYSTEM FIX
-- Run this in Supabase SQL Editor

-- 1. Clean up existing broken data
DELETE FROM cash_trades WHERE status NOT IN ('pending_payment', 'vendor_paid', 'cash_delivered', 'completed');
DELETE FROM notifications WHERE type = 'vendor_payment_received';

-- 2. Fix cash_trades table structure
ALTER TABLE cash_trades DROP CONSTRAINT IF EXISTS cash_trades_status_check;
ALTER TABLE cash_trades 
ADD COLUMN IF NOT EXISTS delivery_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS pickup_location VARCHAR(100);

-- 3. Create proper RLS policies
DROP POLICY IF EXISTS "Allow authenticated users to insert cash trades" ON cash_trades;
DROP POLICY IF EXISTS "Allow users to view cash trades they're involved in" ON cash_trades;
DROP POLICY IF EXISTS "Allow users to update cash trades they're involved in" ON cash_trades;

CREATE POLICY "Cash trades insert policy" ON cash_trades
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Cash trades select policy" ON cash_trades
  FOR SELECT TO authenticated
  USING (
    seller_id = auth.uid() OR 
    buyer_id = auth.uid() OR
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

CREATE POLICY "Cash trades update policy" ON cash_trades
  FOR UPDATE TO authenticated
  USING (
    seller_id = auth.uid() OR 
    buyer_id = auth.uid() OR
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

-- 4. Create vendor assignment function
CREATE OR REPLACE FUNCTION assign_vendor_for_delivery(
  p_delivery_type TEXT,
  p_location TEXT DEFAULT 'Mainland'
) RETURNS UUID AS $$
DECLARE
  vendor_id UUID;
BEGIN
  -- Simple vendor assignment logic
  IF p_delivery_type = 'pickup' THEN
    -- Assign based on location
    SELECT id INTO vendor_id 
    FROM vendors 
    WHERE location = p_location AND active = true 
    ORDER BY RANDOM() 
    LIMIT 1;
  ELSE
    -- For delivery, use any available vendor
    SELECT id INTO vendor_id 
    FROM vendors 
    WHERE active = true 
    ORDER BY RANDOM() 
    LIMIT 1;
  END IF;
  
  RETURN vendor_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Create notification trigger
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
      'Merchant paid you for $' || NEW.usd_amount || ' USD delivery. Customer is waiting!',
      jsonb_build_object(
        'cash_trade_id', NEW.id,
        'usd_amount', NEW.usd_amount,
        'delivery_code', NEW.delivery_code,
        'customer_phone', NEW.customer_phone,
        'delivery_address', NEW.delivery_address,
        'priority', 'high'
      ),
      false
    FROM vendors v 
    WHERE v.id = NEW.vendor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_vendor_payment ON cash_trades;
CREATE TRIGGER trigger_notify_vendor_payment
  AFTER UPDATE ON cash_trades
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_payment();

SELECT 'Database setup complete!' as status;