# Google Play Review Test Credentials

## App Overview
**Central Exchange** - P2P Cryptocurrency Trading Platform
- Package: `com.centralexchange.global`
- Version: 1.0

## Test User Accounts

### Regular User Account
- **Email**: `testuser@centralexchange.com`
- **Password**: `TestUser2024!`
- **Role**: Regular trader
- **Features**: Can buy/sell crypto, send naira for cash

### Premium User Account  
- **Email**: `premium@centralexchange.com`
- **Password**: `Premium2024!`
- **Role**: Premium trader
- **Features**: All regular features + premium trading options

### Merchant Account
- **Email**: `merchant@centralexchange.com`
- **Password**: `Merchant2024!`
- **Role**: Crypto merchant
- **Features**: Can accept trade requests, process payments

### Vendor Accounts (Cash Delivery Agents)

#### Ikeja Vendor
- **Email**: `ikeja@tradehub.com`
- **Password**: `TradeHub2024!`
- **Role**: Cash delivery agent
- **Location**: Ikeja, Lagos
- **Access**: `/vendor/login`

#### Island Vendor
- **Email**: `island@tradehub.com`
- **Password**: `TradeHub2024!`
- **Role**: Cash delivery agent
- **Location**: Victoria Island, Lagos
- **Access**: `/vendor/login`

## Admin Account
- **Email**: `admin@centralexchange.com`
- **Password**: `Admin2024!`
- **Role**: System administrator
- **Features**: User management, credits system, analytics

## App Navigation Guide

### Main User Flow:
1. **Sign Up/Login** → Use any test account above
2. **Home Dashboard** → View crypto prices, recent trades
3. **Buy Crypto** → Purchase BTC/USDT with Naira
4. **Sell Crypto** → Sell BTC/USDT for Naira
5. **Send Naira Get Cash** → Convert USD to physical Naira delivery
6. **My Trades** → View transaction history
7. **Profile Settings** → Account management

### Vendor Flow:
1. **Vendor Login** → Use vendor credentials above
2. **Vendor Dashboard** → View delivery requests
3. **Payment Confirmation** → Confirm payments received
4. **Delivery Details** → Manage cash deliveries
5. **Transactions** → View completed deliveries

### Key Features to Test:
- **P2P Trading**: Crypto buy/sell with escrow
- **Cash Delivery**: Physical Naira delivery service
- **Real-time Updates**: Live trade status updates
- **Payment Integration**: Bank transfer confirmations
- **Mobile Optimization**: Full mobile app experience

## Test Scenarios

### Scenario 1: Buy Cryptocurrency
1. Login as `testuser@centralexchange.com`
2. Navigate to "Buy Crypto"
3. Select BTC, enter amount
4. Complete payment flow (test mode)

### Scenario 2: Cash Delivery Service
1. Login as `premium@centralexchange.com`
2. Go to "Send Naira Get Cash"
3. Enter amount, select pickup location
4. Complete order process

### Scenario 3: Vendor Operations
1. Login as `ikeja@tradehub.com`
2. View delivery requests
3. Confirm payment received
4. Complete delivery process

## Important Notes for Reviewers

- **Test Environment**: All payments are in test mode
- **No Real Money**: No actual cryptocurrency or money transfers
- **Demo Data**: Pre-populated with sample transactions
- **All Features Functional**: Complete app functionality available
- **Mobile Optimized**: Designed for mobile-first experience

## Support Contact
- **Email**: support@centralexchange.com
- **Response Time**: 24 hours during review period

## App Store Listing
- **Category**: Finance
- **Target Audience**: 18+ (Financial services)
- **Geographic Availability**: Nigeria
- **Content Rating**: Everyone (Financial app)