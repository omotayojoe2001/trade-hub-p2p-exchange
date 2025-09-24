-- Fix completed trades that have wrong escrow_status

-- Update all completed trades to have proper escrow_status
UPDATE trades 
SET 
    escrow_status = 'completed',
    updated_at = NOW()
WHERE 
    status = 'completed' 
    AND escrow_status != 'completed';

-- Also ensure completed_at is set for all completed trades
UPDATE trades 
SET 
    completed_at = COALESCE(completed_at, updated_at, NOW()),
    updated_at = NOW()
WHERE 
    status = 'completed' 
    AND completed_at IS NULL;