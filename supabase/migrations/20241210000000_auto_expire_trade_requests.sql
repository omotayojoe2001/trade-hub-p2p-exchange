-- Auto-expire trade requests that are past their expiry time
CREATE OR REPLACE FUNCTION auto_expire_trade_requests()
RETURNS void AS $$
BEGIN
  UPDATE trade_requests 
  SET status = 'expired'
  WHERE status = 'open' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run this function every minute
-- Note: This requires pg_cron extension which may not be available in all environments
-- Alternative: Call this function from the application periodically

-- For immediate cleanup, run the function once
SELECT auto_expire_trade_requests();