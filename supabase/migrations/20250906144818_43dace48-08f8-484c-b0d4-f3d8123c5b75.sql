-- Update merchant_notifications to mark existing ones as read so they don't show up
UPDATE public.merchant_notifications 
SET is_read = true 
WHERE is_read = false;

-- Also cancel any open trade requests that were sent to multiple merchants before the fix
UPDATE public.trade_requests 
SET status = 'cancelled' 
WHERE status = 'open' 
AND created_at < NOW() - INTERVAL '1 hour';  -- Only cancel old ones

-- Clean up old notifications to avoid confusion
DELETE FROM public.notifications 
WHERE type = 'trade_request' 
AND created_at < NOW() - INTERVAL '1 hour';