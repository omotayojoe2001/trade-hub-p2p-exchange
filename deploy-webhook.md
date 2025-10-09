# Deploy BitGo Webhook

## 1. Deploy webhook function
```bash
npx supabase functions deploy bitgo-webhook
```

## 2. Set webhook URL in BitGo Dashboard
Go to BitGo → Webhooks → Add New Webhook:
- **URL**: `https://towffqxmmqyhbuyphkui.functions.supabase.co/bitgo-webhook`
- **Events**: `transfer`
- **Wallets**: Select all your wallets (BTC, ETH, XRP, POLYGON)

## 3. Test with small transaction
Send a small amount to any generated address to test webhook notifications.