# Production Deployment Checklist

## BitGo Setup
- [ ] Create production BitGo account
- [ ] Generate production API token with required permissions
- [ ] Create production BTC wallet
- [ ] Create production ETH wallet
- [ ] Set wallet passphrases
- [ ] Configure webhook URLs

## Environment Variables
Update these in Supabase Edge Functions:
- [ ] `BITGO_ACCESS_TOKEN` - Production token
- [ ] `BITGO_BTC_WALLET_ID` - Production BTC wallet
- [ ] `BITGO_ETH_WALLET_ID` - Production ETH wallet
- [ ] `BITGO_WALLET_PASSPHRASE` - Wallet passphrase

## Webhook Configuration
Set up BitGo webhooks pointing to:
- [ ] `https://[your-project].supabase.co/functions/v1/bitgo-webhook`

## Database Tables
Ensure these tables exist:
- [ ] `escrow_addresses`
- [ ] `trade_requests` 
- [ ] `cash_trades`
- [ ] `notifications`
- [ ] `credits_transactions`

## Edge Functions
Deploy these functions:
- [ ] `bitgo-escrow` (updated for production)
- [ ] `bitgo-webhook` (new)

## Testing
- [ ] Test small BTC transaction
- [ ] Test small ETH transaction
- [ ] Verify webhook notifications
- [ ] Test complete trade flows

## Security
- [ ] Enable RLS on all tables
- [ ] Verify API permissions
- [ ] Test error handling
- [ ] Monitor logs

## Go Live Steps
1. Update environment variables
2. Deploy Edge Functions
3. Configure BitGo webhooks
4. Test with small amounts
5. Monitor for 24 hours
6. Full launch