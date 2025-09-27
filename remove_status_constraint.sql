-- Remove status constraint completely

ALTER TABLE cash_trades DROP CONSTRAINT IF EXISTS cash_trades_status_check;

SELECT 'Status constraint removed!' as status;