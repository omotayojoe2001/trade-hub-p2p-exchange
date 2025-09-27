-- Fix vendor notifications system
-- Run this SQL in Supabase SQL Editor

-- 1. Ensure cash_trades table has all required columns
ALTER TABLE cash_trades 
ADD COLUMN IF NOT EXISTS vendor_acknowledged_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivery_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS vendor_delivery_confirmed BOOLEAN DEFAULT FALSE;

-- 2. Update cash_trades status constraint to include new statuses
ALTER TABLE cash_trades 
DROP CONSTRAINT IF EXISTS cash_trades_status_check;

ALTER TABLE cash_trades 
ADD CONSTRAINT cash_trades_status_check 
CHECK (status IN (
  'pending_payment', 
  'payment_submitted', 
  'payment_confirmed', 
  'vendor_paid', 
  'delivery_in_progress', 
  'cash_delivered', 
  'completed', 
  'cancelled'
));

-- 3. Create index for faster vendor queries
CREATE INDEX IF NOT EXISTS idx_cash_trades_vendor_status 
ON cash_trades(vendor_id, status) 
WHERE status IN ('vendor_paid', 'delivery_in_progress');

-- 4. Create index for real-time notifications
CREATE INDEX IF NOT EXISTS idx_cash_trades_vendor_updated 
ON cash_trades(vendor_id, updated_at DESC);

-- 5. Ensure notifications table has proper indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON notifications(user_id, read);

-- 6. Create function to automatically notify vendors on payment
CREATE OR REPLACE FUNCTION notify_vendor_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger on status change to 'vendor_paid'
  IF NEW.status = 'vendor_paid' AND (OLD.status IS NULL OR OLD.status != 'vendor_paid') THEN
    -- Get vendor's user_id
    DECLARE
      vendor_user_id UUID;
    BEGIN
      SELECT user_id INTO vendor_user_id 
      FROM vendors 
      WHERE id = NEW.vendor_id;
      
      -- Insert notification if vendor found
      IF vendor_user_id IS NOT NULL THEN
        INSERT INTO notifications (
          user_id,
          type,
          title,
          message,
          data,
          read
        ) VALUES (
          vendor_user_id,
          'vendor_payment_received',
          '💰 URGENT: Payment Received!',
          'You received payment for $' || NEW.usd_amount || ' USD cash delivery. Customer is waiting - deliver immediately!',
          jsonb_build_object(
            'cash_trade_id', NEW.id,
            'trade_request_id', NEW.trade_request_id,
            'vendor_id', NEW.vendor_id,
            'usd_amount', NEW.usd_amount,
            'delivery_type', NEW.delivery_type,
            'delivery_address', NEW.delivery_address,
            'pickup_location', NEW.pickup_location,
            'delivery_code', NEW.delivery_code,
            'seller_phone', NEW.seller_phone,
            'priority', 'high',
            'requires_action', true,
            'notification_type', 'payment_received'
          ),
          false
        );
        
        RAISE NOTICE 'Vendor notification sent to user_id: %', vendor_user_id;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for automatic vendor notifications
DROP TRIGGER IF EXISTS trigger_notify_vendor_on_payment ON cash_trades;
CREATE TRIGGER trigger_notify_vendor_on_payment
  AFTER UPDATE ON cash_trades
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_payment();

-- 8. Enable RLS on cash_trades if not already enabled
ALTER TABLE cash_trades ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policy for vendors to see their own trades
DROP POLICY IF EXISTS "Vendors can view their own cash trades" ON cash_trades;
CREATE POLICY "Vendors can view their own cash trades" ON cash_trades
  FOR SELECT USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

-- 10. Create RLS policy for vendors to update their own trades
DROP POLICY IF EXISTS "Vendors can update their own cash trades" ON cash_trades;
CREATE POLICY "Vendors can update their own cash trades" ON cash_trades
  FOR UPDATE USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

-- 11. Test the notification system with a sample update
-- (Uncomment the lines below to test)
/*
-- Find a vendor to test with
SELECT id, user_id, display_name FROM vendors LIMIT 1;

-- Create a test cash trade (replace vendor_id with actual vendor ID)
INSERT INTO cash_trades (
  trade_request_id,
  seller_id,
  buyer_id,
  vendor_id,
  usd_amount,
  delivery_type,
  delivery_code,
  seller_phone,
  status
) VALUES (
  'test-' || extract(epoch from now()),
  'test-seller',
  'test-buyer',
  'YOUR_VENDOR_ID_HERE', -- Replace with actual vendor ID
  100,
  'delivery',
  'TEST123',
  '+234-800-000-0000',
  'pending_payment'
);

-- Update to trigger notification (replace with actual cash trade ID)
UPDATE cash_trades 
SET status = 'vendor_paid', updated_at = now()
WHERE trade_request_id LIKE 'test-%'
AND vendor_id = 'YOUR_VENDOR_ID_HERE'; -- Replace with actual vendor ID
*/

-- 12. Create view for vendor dashboard
CREATE OR REPLACE VIEW vendor_active_deliveries AS
SELECT 
  ct.*,
  v.display_name as vendor_name,
  v.phone as vendor_phone,
  tr.crypto_type,
  tr.amount_crypto
FROM cash_trades ct
JOIN vendors v ON ct.vendor_id = v.id
LEFT JOIN trade_requests tr ON ct.trade_request_id = tr.id
WHERE ct.status IN ('vendor_paid', 'delivery_in_progress')
ORDER BY ct.updated_at DESC;

-- Grant access to the view
GRANT SELECT ON vendor_active_deliveries TO authenticated;

COMMIT;

-- Success message
SELECT 'Vendor notification system setup complete! 🎉' as status;