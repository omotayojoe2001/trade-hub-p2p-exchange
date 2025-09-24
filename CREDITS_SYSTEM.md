# Credits System Documentation

## Overview
The TradeHub P2P Exchange now uses a **credit-based system** instead of premium subscriptions. All users can access cash services (pickup/delivery) by purchasing credits with cryptocurrency.

## Credit Value System
- **1 Credit = $0.01 USD**
- **100 Credits = $1.00 USD**
- **Minimum Purchase: 10 Credits ($0.10)**
- **Maximum Purchase: 100,000 Credits ($1,000.00)**

## Credit Costs for Services
| Service | Credits Required | USD Value |
|---------|------------------|-----------|
| Cash Pickup | 50 credits | $0.50 |
| Cash Delivery | 100 credits | $1.00 |
| Priority Support | 25 credits | $0.25 |
| Advanced Features | 75 credits | $0.75 |
| Premium Matching | 10 credits | $0.10 |
| Extended Escrow | 15 credits | $0.15 |

## Cryptocurrency Pricing
Based on approximate market values:
- **BTC Price: ~$100,000 USD**
- **ETH Price: ~$3,500 USD**

### Credit Package Examples
| Credits | USD Value | BTC Amount | ETH Amount |
|---------|-----------|------------|------------|
| 100 | $1.00 | 0.00001 BTC | 0.0003 ETH |
| 500 | $5.00 | 0.00005 BTC | 0.0014 ETH |
| 1000 | $10.00 | 0.0001 BTC | 0.0029 ETH |
| 2500 | $25.00 | 0.00025 BTC | 0.0071 ETH |
| 5000 | $50.00 | 0.0005 BTC | 0.0143 ETH |

## Purchase Flow

### Step 1: Package Selection
- Choose from predefined packages or enter custom amount
- Minimum 10 credits required
- Select payment method (BTC or ETH)

### Step 2: Payment
- Unique payment address generated for each purchase
- 2-hour expiry window for payment
- Upload payment proof or transaction hash
- Real-time countdown timer

### Step 3: Confirmation
- Payment verification (automatic in demo mode)
- Credits added to user account
- Transaction recorded in history

## Demo Mode Features
When database is unavailable, the system runs in **Demo Mode**:
- Mock payment addresses generated
- Payments auto-confirmed after 3 seconds
- Demo user starts with 250 credits
- All functionality preserved for testing

## Database Structure

### Tables Created
1. **credit_purchases** - Tracks all credit purchases
2. **credit_transactions** - Records all credit movements
3. **profiles.credits** - User credit balance (default: 0)

### Functions Created
1. **add_user_credits()** - Adds credits to user account
2. **spend_user_credits()** - Deducts credits with validation

## Files Modified/Created

### Core Components
- `src/pages/CreditsPurchase.tsx` - Main purchase interface
- `src/pages/CreditsHistory.tsx` - Purchase and transaction history
- `src/components/credits/CreditValueCalculator.tsx` - Credit value display

### Services
- `src/services/creditsService.ts` - Real credit management
- `src/services/mockCreditsService.ts` - Demo mode service
- `src/services/bitgoEscrow.ts` - Updated with mock addresses

### Database
- `supabase/migrations/20250109000024_create_credits_system.sql` - Credit system tables

## Key Features

### Real-time Updates
- Credit balance updates automatically
- Real-time subscription to balance changes
- Instant UI updates on purchase completion

### Error Handling
- Comprehensive validation for purchase amounts
- Fallback to demo mode when database unavailable
- User-friendly error messages

### Security Considerations
- Input validation on all credit amounts
- Secure database functions with proper permissions
- Transaction logging for audit trail

### Mobile-First Design
- Responsive design optimized for mobile
- Touch-friendly interactions
- Native app-like experience

## Usage Examples

### Purchasing Credits
```typescript
// Validate purchase amount
const validation = creditsService.validatePurchaseAmount(credits);
if (!validation.valid) {
  // Show error message
}

// Calculate crypto amount
const cryptoAmount = creditsService.calculateCryptoAmount(credits, 'BTC');

// Create purchase
const result = await mockCreditsService.createPurchase(userId, credits, 'BTC');
```

### Spending Credits
```typescript
// Check if user has enough credits
const hasEnough = await creditsService.hasEnoughCredits(userId, 50);

// Spend credits for cash pickup
if (hasEnough) {
  await creditsService.spendCredits(userId, 50, 'Cash pickup service');
}
```

### Real-time Balance Updates
```typescript
// Subscribe to credit changes
const subscription = creditsService.subscribeToCredits(userId, (credits) => {
  setUserCredits(credits);
});

// Cleanup
subscription?.unsubscribe();
```

## Integration Points

### Home Screen
- Displays current credit balance
- Quick link to purchase more credits
- Demo mode indicator

### Trade Flow
- Credit validation before cash services
- Automatic credit deduction on service use
- Balance updates in real-time

### Settings
- Credit history accessible from settings
- Purchase history with transaction details
- Transaction filtering and search

## Future Enhancements
1. **Auto-recharge** - Automatic credit purchase when balance low
2. **Credit gifting** - Send credits to other users
3. **Bulk discounts** - Better rates for large purchases
4. **Subscription plans** - Monthly credit packages
5. **Referral rewards** - Earn credits for referrals

## Testing
- Demo mode allows full testing without database
- Mock payments confirm automatically
- All UI flows preserved in demo mode
- Real-time updates work in both modes

## Deployment Notes
- Set `isDemoMode = false` for production
- Ensure database migrations are applied
- Configure real BitGo API credentials
- Test payment flow end-to-end