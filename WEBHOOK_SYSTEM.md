# BitGo Webhook System Documentation

## Overview
The BitGo webhook system automatically detects when real cryptocurrency payments (BTC/USDT) are received and processes them for:
1. **Trade Escrow** - P2P crypto trading
2. **Credits Purchase** - Buying platform credits with crypto

## Webhook URL
```
https://towffqxmmqyhbuyphkui.supabase.co/functions/v1/bitgo-webhook
```

## Supported Cryptocurrencies
- **BTC** (Bitcoin)
- **USDT** (Tether on Solana)

## How It Works

### 1. Trade Escrow Flow
When a user initiates a crypto trade:
1. System generates escrow address via BitGo
2. Address stored in `escrow_addresses` table with status `pending`
3. User sends crypto to escrow address
4. BitGo webhook detects payment and calls our endpoint
5. Webhook updates escrow status to `confirmed`
6. Trade status updated to `crypto_deposited`
7. Both buyer and seller get notifications

### 2. Credits Purchase Flow
When a user buys credits with crypto:
1. System generates payment address via BitGo
2. Purchase record created in `credit_purchases` table with status `pending`
3. User sends crypto to payment address
4. BitGo webhook detects payment and calls our endpoint
5. Webhook verifies amount matches expected payment
6. Credits added to user account via `add_user_credits()` function
7. Purchase marked as `completed`
8. User gets notification

## Database Tables

### escrow_addresses
```sql
- id (UUID)
- trade_id (UUID) - Links to trades table
- address (TEXT) - BitGo generated address
- coin (TEXT) - BTC/USDT
- status (TEXT) - pending/confirmed
- tx_hash (TEXT) - Transaction hash when confirmed
- received_amount (DECIMAL) - Amount received
- confirmed_at (TIMESTAMP)
```

### credit_purchases
```sql
- id (UUID)
- user_id (UUID) - User buying credits
- crypto_type (TEXT) - BTC/ETH/USDT
- crypto_amount (DECIMAL) - Expected crypto amount
- credits_amount (INTEGER) - Credits to add
- payment_address (TEXT) - BitGo payment address
- transaction_hash (TEXT) - TX hash when confirmed
- status (TEXT) - pending/paid/confirmed/completed/failed
- confirmed_at (TIMESTAMP)
```

### trades
```sql
- id (UUID)
- buyer_id, seller_id (UUID)
- coin_type (TEXT) - BTC/USDT
- amount (DECIMAL) - Crypto amount
- status (TEXT) - pending/crypto_deposited/completed
- escrow_status (TEXT) - pending/crypto_deposited/completed
- escrow_address (TEXT) - BitGo escrow address
```

## Webhook Processing Logic

### BTC Payments
- Uses `outputs` array from webhook payload
- Each output contains `address` and `value` (in satoshis)
- Converts satoshis to BTC for amount verification

### USDT Payments  
- Uses `entries` array from webhook payload
- Each entry contains `address` and `value`
- Value already in USDT units

### Payment Verification
1. **Address Matching**: Finds records with matching payment address
2. **Amount Verification**: For credits, verifies received amount matches expected (±2% tolerance)
3. **Status Updates**: Updates database records and user balances
4. **Notifications**: Sends real-time notifications to users

## Error Handling
- All webhook calls logged to `bitgo_webhooks` table for debugging
- Comprehensive error logging with detailed context
- Graceful handling of missing or invalid data
- Automatic retry logic for failed database operations

## Security Features
- Row Level Security (RLS) on all tables
- Service role permissions for webhook operations
- Address validation and amount verification
- Transaction hash recording for audit trail

## Testing
Use the `test-webhook.js` script to test webhook functionality:

```bash
node test-webhook.js
```

## Monitoring
- Check `bitgo_webhooks` table for all incoming webhook calls
- Monitor `credit_purchases` and `escrow_addresses` status changes
- Review `notifications` table for user alerts
- Check application logs for any processing errors

## BitGo Configuration
1. **BTC Webhook**: 
   - Type: Transfers
   - Confirmations: 1
   - URL: webhook endpoint

2. **USDT Webhook**:
   - Type: Transfers  
   - Confirmations: 1
   - Include token activity: ✅ ENABLED
   - URL: same webhook endpoint

## Integration Points
- **Frontend**: Real-time notifications via Supabase realtime
- **BitGo API**: Escrow address generation
- **Database**: Automatic status updates and credit management
- **Notifications**: Push notifications to mobile apps