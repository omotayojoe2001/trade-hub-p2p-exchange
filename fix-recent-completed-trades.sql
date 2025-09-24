-- Fix recent completed trades that might have wrong escrow_status
UPDATE trades 
SET 
    escrow_status = 'completed',
    completed_at = COALESCE(completed_at, updated_at, NOW()),
    updated_at = NOW()
WHERE 
    status = 'completed' 
    AND (escrow_status != 'completed' OR completed_at IS NULL)
    AND created_at > NOW() - INTERVAL '24 hours';

-- Also check for any trades that were just completed but status is wrong
UPDATE trades 
SET 
    status = 'completed',
    escrow_status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
WHERE 
    updated_at > NOW() - INTERVAL '1 hour'
    AND (status = 'payment_sent' OR escrow_status = 'cash_received');