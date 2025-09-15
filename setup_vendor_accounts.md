# Complete Vendor Account Setup Guide

## Step 1: Create Auth Users in Supabase

Go to **Supabase Dashboard > Authentication > Users** and create these 6 accounts:

### Mainland Vendors:
1. **Email**: `ikeja@tradehub.com` | **Password**: `TradeHub2024!`
2. **Email**: `yaba@tradehub.com` | **Password**: `TradeHub2024!`  
3. **Email**: `airport@tradehub.com` | **Password**: `TradeHub2024!`

### Island Vendors:
4. **Email**: `island@tradehub.com` | **Password**: `TradeHub2024!`
5. **Email**: `lekki@tradehub.com` | **Password**: `TradeHub2024!`
6. **Email**: `ajah@tradehub.com` | **Password**: `TradeHub2024!`

**Copy each User ID after creation!**

## Step 2: Run SQL Scripts in Order

1. ✅ `create_vendors_table.sql`
2. ✅ `update_vendors_table.sql`
3. ✅ `update_profiles_points.sql`
4. ✅ `create_premium_cash_orders.sql`
5. ✅ `create_vendor_tables_only.sql`
6. ✅ `create_tables.sql`
7. **NEW** → `create_vendor_roles.sql`

## Step 3: Setup Each Vendor Account

For each vendor, run this SQL (replace USER_ID with actual UUID):

```sql
-- Example for Ikeja vendor (repeat for all 6)
-- Replace 'ACTUAL_USER_ID' with the real UUID from Supabase Auth

-- 1. Assign vendor role
SELECT assign_vendor_role('ACTUAL_USER_ID');

-- 2. Create profile
INSERT INTO profiles (user_id, display_name, phone_number, location, bio, user_type, is_vendor) 
VALUES ('ACTUAL_USER_ID', 'TradeHub Ikeja Agent', '+234 801 234 5678', 'Ikeja, Lagos', 'Cash delivery agent for Ikeja area', 'vendor', true);

-- 3. Link to vendor
UPDATE vendors SET user_id = 'ACTUAL_USER_ID' WHERE location = 'Ikeja';

-- 4. Create credentials
INSERT INTO vendor_credentials (vendor_id, user_id, username) 
VALUES ((SELECT id FROM vendors WHERE location = 'Ikeja'), 'ACTUAL_USER_ID', 'ikeja_agent');
```

## Step 4: Vendor Details for Each Location

**Ikeja**: `ikeja@tradehub.com` → Ikeja, Lagos → `ikeja_agent`
**Yaba**: `yaba@tradehub.com` → Yaba, Lagos → `yaba_agent`  
**Airport**: `airport@tradehub.com` → Airport Road, Lagos → `airport_agent`
**Island**: `island@tradehub.com` → Lagos Island → `island_agent`
**Lekki**: `lekki@tradehub.com` → Lekki, Lagos → `lekki_agent`
**Ajah**: `ajah@tradehub.com` → Ajah, Lagos → `ajah_agent`

## Step 5: Test Vendor Login

Each vendor can login at `/vendor/login` with their email/password.
The system will check for `vendor` role in `user_roles` table.

## Step 6: Add Foreign Key

```sql
ALTER TABLE points_transactions 
ADD CONSTRAINT fk_points_transactions_order_id 
FOREIGN KEY (order_id) REFERENCES premium_cash_orders(id);
```