# Vendor Setup Instructions

## Step 1: Create Vendor Auth Accounts in Supabase

Go to Supabase Auth and create these 6 vendor accounts:

### Mainland Vendors:
1. **Ikeja Agent**
   - Email: `ikeja@tradehub.com`
   - Password: `TradeHub2024!`
   - Copy the generated User ID

2. **Yaba Agent**
   - Email: `yaba@tradehub.com`
   - Password: `TradeHub2024!`
   - Copy the generated User ID

3. **Airport Agent**
   - Email: `airport@tradehub.com`
   - Password: `TradeHub2024!`
   - Copy the generated User ID

### Island Vendors:
4. **Island Agent**
   - Email: `island@tradehub.com`
   - Password: `TradeHub2024!`
   - Copy the generated User ID

5. **Lekki Agent**
   - Email: `lekki@tradehub.com`
   - Password: `TradeHub2024!`
   - Copy the generated User ID

6. **Ajah Agent**
   - Email: `ajah@tradehub.com`
   - Password: `TradeHub2024!`
   - Copy the generated User ID

## Step 2: Update SQL Script

Replace the placeholder User IDs in `create_vendor_profiles.sql`:

- Replace `VENDOR_IKEJA_USER_ID` with actual Ikeja agent User ID
- Replace `VENDOR_YABA_USER_ID` with actual Yaba agent User ID
- Replace `VENDOR_AIRPORT_USER_ID` with actual Airport agent User ID
- Replace `VENDOR_ISLAND_USER_ID` with actual Island agent User ID
- Replace `VENDOR_LEKKI_USER_ID` with actual Lekki agent User ID
- Replace `VENDOR_AJAH_USER_ID` with actual Ajah agent User ID

## Step 3: Run SQL Scripts in Order

1. `create_vendors_table.sql` (if not already run)
2. `update_vendors_table.sql`
3. `create_vendor_profiles.sql` (after updating User IDs)
4. `create_premium_cash_orders.sql`
5. `update_profiles_points.sql`

## Step 4: Test Vendor Login

Each vendor can login at `/vendor/login` with their email and password.

## Vendor Login Credentials:
- **Ikeja**: ikeja@tradehub.com / TradeHub2024!
- **Yaba**: yaba@tradehub.com / TradeHub2024!
- **Airport**: airport@tradehub.com / TradeHub2024!
- **Island**: island@tradehub.com / TradeHub2024!
- **Lekki**: lekki@tradehub.com / TradeHub2024!
- **Ajah**: ajah@tradehub.com / TradeHub2024!








