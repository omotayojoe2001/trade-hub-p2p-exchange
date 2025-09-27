-- SIMPLE vendor notification test - uses existing data only

-- 1. Find existing cash trade and update it
UPDATE cash_trades 
SET status = 'vendor_paid', updated_at = now()
WHERE id = (SELECT id FROM cash_trades LIMIT 1);

-- 2. Check if notification was created
SELECT 
    'Notification sent!' as result,
    n.title, 
    n.message, 
    n.created_at
FROM notifications n
WHERE n.type = 'vendor_payment_received'
ORDER BY n.created_at DESC
LIMIT 1;