# Manual Test Steps for Vendor Notifications

## Quick Test (Recommended)
1. Login as vendor: `/vendor/login` with `ikeja@tradehub.com` / `TradeHub2024!`
2. Keep vendor dashboard open
3. Run `test_vendor_popup.sql` in Supabase SQL Editor
4. **BIG POPUP should appear immediately!**

## Full Flow Test
1. **Tab 1**: Login as vendor (`ikeja@tradehub.com`)
2. **Tab 2**: Create sell-for-cash trade as customer
3. **Tab 3**: Accept trade as merchant and pay vendor
4. **Tab 1**: Vendor should see popup notification

## Expected Popup Features
- ✅ Big animated popup with payment details
- ✅ Shows $500 USD delivery amount
- ✅ Customer phone: +234-800-000-0000
- ✅ Delivery code: TEST123
- ✅ "Accept Delivery" and "View Later" buttons
- ✅ Urgent styling with green colors

## Troubleshooting
- **No popup**: Check browser console for errors
- **No vendor_id**: Check localStorage in vendor dashboard
- **No notification**: Check if SQL script ran successfully

## Debug Console Messages
Look for these in browser console:
```
🔔 VENDOR NOTIFICATION: Setting up real-time subscription for vendor: [vendor_id]
🔔 VENDOR NOTIFICATION: Cash trade update received: [payload]
✅ VENDOR NOTIFICATION: Payment received for vendor!
```