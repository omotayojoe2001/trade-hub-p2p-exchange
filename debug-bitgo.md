# BitGo Debug Checklist

## 1. Check Supabase Environment Variables
Go to Supabase Dashboard → Settings → Edge Functions → Environment Variables

Required variables:
- `BITGO_ACCESS_TOKEN` - Your BitGo API token
- `BITGO_BTC_WALLET_ID` - Bitcoin wallet ID
- `BITGO_USDT_WALLET_ID` - USDT wallet ID
- `BITGO_ETH_WALLET_ID` - Ethereum wallet ID

## 2. BitGo Token Issues
- Check if token is expired
- Verify IP restrictions (Supabase uses dynamic IPs)
- Test token with BitGo API directly

## 3. Wallet Configuration
- Ensure wallets exist in BitGo dashboard
- Verify wallet IDs are correct
- Check wallet permissions

## 4. Network Issues
- BitGo API may be down
- Supabase Edge Functions connectivity issues
- API rate limits exceeded

## 5. Quick Test
Add this to your BitGo Edge Function to debug:

```javascript
console.log('Debug info:', {
  hasToken: !!BITGO_ACCESS_TOKEN,
  tokenPrefix: BITGO_ACCESS_TOKEN?.substring(0, 10),
  walletId: BTC_WALLET_ID?.substring(0, 8),
  coinType: 'btc'
});
```