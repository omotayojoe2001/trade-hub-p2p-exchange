# Sell-for-Cash Flow - Complete Test Guide

## Overview
The sell-for-cash flow allows users to sell cryptocurrency and receive USD cash delivery through a 3-party system involving the seller, buyer (merchant), and cash delivery vendor.

## Flow Steps

### 1. User Initiates Sell-for-Cash
**Page**: `/sell-for-cash`
- User selects cryptocurrency (BTC, ETH, USDT, etc.)
- Enters amount to sell
- Chooses delivery method (pickup/delivery)
- Provides location/address details
- System calculates USD value and required credits

### 2. Crypto Escrow Deposit
**Page**: `/cash-escrow-flow`
- Real BitGo escrow address generated
- User deposits crypto to secure address
- Upload payment proof (transaction screenshot)
- Trade request created and broadcast to merchants

### 3. Merchant Accepts Trade
**Page**: `/trade-request-details` → `/cash-trade-flow`
- Merchants see trade request notifications
- Fastest merchant accepts the trade
- System routes to cash trade flow for vendor payment

### 4. Buyer Pays Vendor
**Page**: `/cash-trade-flow`
- Buyer sees vendor bank details
- Pays vendor the USD amount (converted to Naira)
- Uploads payment proof
- Delivery code generated and shared

### 5. Vendor Delivers Cash
**Page**: `/vendor-cash-dashboard`
- Vendor receives payment notification
- Delivers USD cash to seller
- Confirms delivery in vendor dashboard
- Seller gets notification with delivery code

### 6. Seller Confirms Receipt
**Page**: `/confirm-cash-receipt`
- Seller enters 6-character delivery code
- Confirms cash receipt
- Crypto released to buyer
- Trade marked as completed

## Database Tables Required

### 1. Run Setup Script
```sql
-- Execute this first
c:/Users/user/Desktop/trade-hub-p2p-exchange/setup_cash_trade_tables.sql
```

### 2. Key Tables
- `vendors` - Cash delivery agents
- `cash_trades` - Cash-specific trade data
- `delivery_codes` - Verification codes for cash delivery
- `trade_requests` - Main trade requests
- `trades` - Completed trades
- `notifications` - User notifications

## Test Scenarios

### Scenario 1: Complete Happy Path
1. **Seller**: Create sell-for-cash request for 0.01 BTC → $1,050 USD
2. **System**: Generate BitGo escrow address
3. **Seller**: Deposit crypto and upload proof
4. **Merchant**: Accept trade request
5. **Merchant**: Pay vendor ₦1,732,500 (1650 rate)
6. **Vendor**: Deliver $1,050 USD cash to seller
7. **Seller**: Confirm receipt with delivery code
8. **System**: Release 0.01 BTC to merchant

### Scenario 2: Pickup vs Delivery
- **Pickup**: Seller goes to vendor location
- **Delivery**: Vendor delivers to seller address
- Both use same delivery code verification

### Scenario 3: Error Handling
- Invalid delivery codes
- Failed vendor payments
- Database rollback on errors
- BitGo address generation fallbacks

## Key Features Implemented

### ✅ Real BitGo Integration
- Generates actual escrow addresses
- Fallback to demo addresses if BitGo fails
- Proper error handling and logging

### ✅ Credits System
- Platform fees calculated based on USD amount
- Service fees calculated after location selection
- Credits spent only after successful trade creation

### ✅ Vendor Management
- Vendor authentication system
- Location-based vendor selection
- Bank details and profile management

### ✅ Delivery Code System
- 6-character alphanumeric codes
- Prevents unauthorized cash release
- Tracks code usage and timestamps

### ✅ Real-time Notifications
- Trade request broadcasts
- Payment confirmations
- Delivery status updates
- Crypto release notifications

### ✅ Error Recovery
- Transaction rollback on failures
- localStorage fallbacks
- Proper error messaging
- Data consistency checks

## Routes Added
- `/sell-for-cash` - Initial sell request
- `/cash-escrow-flow` - Crypto deposit flow
- `/cash-trade-flow` - Buyer payment to vendor
- `/confirm-cash-receipt` - Seller confirms delivery
- `/vendor-cash-dashboard` - Vendor delivery management

## Security Features
- Escrow protection for crypto
- Delivery code verification
- Payment proof requirements
- Multi-party verification system
- Database transaction integrity

## Testing Checklist

### Pre-Test Setup
- [ ] Run `setup_cash_trade_tables.sql`
- [ ] Ensure vendor accounts exist
- [ ] Verify BitGo credentials configured
- [ ] Check credits system working

### User Flow Testing
- [ ] Sell-for-cash request creation
- [ ] BitGo address generation
- [ ] Crypto deposit and proof upload
- [ ] Trade broadcast to merchants
- [ ] Merchant acceptance and routing
- [ ] Vendor payment and proof upload
- [ ] Delivery code generation
- [ ] Cash delivery confirmation
- [ ] Receipt confirmation with code
- [ ] Crypto release to buyer

### Error Testing
- [ ] Invalid delivery codes
- [ ] Failed database operations
- [ ] BitGo service failures
- [ ] Insufficient credits
- [ ] Network connectivity issues

The sell-for-cash flow is now complete and ready for comprehensive testing. All critical errors have been fixed and the system includes proper error handling, transaction integrity, and security features.