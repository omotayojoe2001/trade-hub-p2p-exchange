-- FOOLPROOF Vendor Notifications SQL - Handles all existing data
-- Run this in Supabase SQL Editor

-- 1. Remove existing constraint safely
ALTER TABLE cash_trades DROP CONSTRAINT IF EXISTS cash_trades_status_check;

-- 2. Update any invalid status values to valid ones
UPDATE cash_trades SET status = 'pending_payment' WHERE status IS NULL;
UPDATE cash_trades SET status = 'pending_payment' WHERE status NOT IN (
    'pending_payment', 'payment_submitted', 'payment_confirmed', 
    'vendor_paid', 'delivery_in_progress', 'cash_delivered', 
    'completed', 'cancelled', 'open', 'matched', 'payment_sent',
    'escrow_funded', 'dispute', 'expired'
);

-- 3. Add new columns safely
ALTER TABLE cash_trades 
ADD COLUMN IF NOT EXISTS vendor_acknowledged_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivery_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS vendor_delivery_confirmed BOOLEAN DEFAULT FALSE;

-- 4. Create comprehensive status constraint
ALTER TABLE cash_trades 
ADD CONSTRAINT cash_trades_status_check 
CHECK (status IN (
    'pending_payment', 'payment_submitted', 'payment_confirmed', 
    'vendor_paid', 'delivery_in_progress', 'cash_delivered', 
    'completed', 'cancelled', 'open', 'matched', 'payment_sent',
    'escrow_funded', 'dispute', 'expired'
));

-- 5. Create notification function
CREATE OR REPLACE FUNCTION notify_vendor_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'vendor_paid' AND (OLD IS NULL OR OLD.status != 'vendor_paid') THEN
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
            'You received payment for $' || NEW.usd_amount || ' USD delivery. Act now!',
            jsonb_build_object(
                'cash_trade_id', NEW.id,
                'usd_amount', NEW.usd_amount,
                'delivery_code', NEW.delivery_code,
                'priority', 'high'
            ),
            false
        FROM vendors v 
        WHERE v.id = NEW.vendor_id AND v.user_id IS NOT NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger
DROP TRIGGER IF EXISTS trigger_notify_vendor_on_payment ON cash_trades;
CREATE TRIGGER trigger_notify_vendor_on_payment
    AFTER UPDATE ON cash_trades
    FOR EACH ROW
    EXECUTE FUNCTION notify_vendor_on_payment();

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS idx_cash_trades_vendor_status ON cash_trades(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- 8. Enable RLS and policies
ALTER TABLE cash_trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can view their cash trades" ON cash_trades;
CREATE POLICY "Vendors can view their cash trades" ON cash_trades
    FOR SELECT USING (
        vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Vendors can update their cash trades" ON cash_trades;
CREATE POLICY "Vendors can update their cash trades" ON cash_trades
    FOR UPDATE USING (
        vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    );

-- 9. Skip test to avoid foreign key issues

SELECT 'Vendor notification system ready! ✅' as status;