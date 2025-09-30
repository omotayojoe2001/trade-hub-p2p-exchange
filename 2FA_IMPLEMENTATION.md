# 2FA Implementation Guide

## How 2FA Works in Central Exchange

### When 2FA is Required:
1. **After 24 hours** - Users must verify 2FA every 24 hours
2. **New device login** - First time logging in from a new device
3. **High-value transactions** - Trades above certain thresholds
4. **Account settings changes** - Password changes, adding payment methods

### Implementation Details:

#### 1. Database Storage (`user_2fa` table):
- `user_id` - Links to auth.users
- `secret` - TOTP secret key
- `backup_codes` - Array of recovery codes
- `is_enabled` - Boolean flag
- `last_used_at` - Timestamp of last verification

#### 2. Session Management:
- Uses localStorage to track last 2FA verification
- Key: `last_2fa_login_{userId}`
- Expires after 24 hours

#### 3. 2FA Flow:
1. User enables 2FA in settings
2. QR code generated with TOTP secret
3. User scans with authenticator app
4. Secret stored in database
5. On login, if 24+ hours passed, 2FA required
6. User enters 6-digit code from authenticator
7. Code verified against stored secret
8. Session marked as 2FA-verified for 24 hours

#### 4. Authenticator Apps Supported:
- Google Authenticator
- Microsoft Authenticator
- Authy
- Any TOTP-compatible app

#### 5. Backup Codes:
- 10 single-use backup codes generated
- Can be used if authenticator unavailable
- Stored encrypted in database

### Current Status:
✅ Database table created
✅ Service layer implemented
✅ UI components ready
✅ Settings integration complete
⚠️ TOTP verification needs crypto library (speakeasy/otplib)
⚠️ Backup codes generation pending
⚠️ Login flow integration pending

### To Complete Implementation:
1. Install TOTP library: `npm install otplib qrcode`
2. Update verification logic in `twoFactorAuthService.ts`
3. Add 2FA check to login flow in `Auth.tsx`
4. Generate and display backup codes