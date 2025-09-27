-- Fix cash_trades status constraint

-- Drop existing constraint
ALTER TABLE cash_trades DROP CONSTRAINT IF EXISTS cash_trades_status_check;

-- Add new constraint with all possible status values
ALTER TABLE cash_trades 
ADD CONSTRAINT cash_trades_status_check 
CHECK (status IN (
  'pending_payment', 'payment_submitted', 'payment_confirmed', 
  'vendor_paid', 'delivery_in_progress', 'cash_delivered', 
  'completed', 'cancelled', 'open', 'matched', 'payment_sent',
  'escrow_funded', 'dispute', 'expired', 'pending', 'active',
  'awaiting_payment', 'payment_received', 'ready_for_delivery'
));

SELECT 'Status constraint fixed!' as status;