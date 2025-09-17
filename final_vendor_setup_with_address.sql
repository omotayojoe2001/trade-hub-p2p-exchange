-- FINAL VENDOR SETUP - HANDLES ADDRESS COLUMN
-- Run this once to fix everything including the address constraint

-- 1. Fix profiles table constraints
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;

-- 2. Fix premium_cash_orders constraints  
ALTER TABLE premium_cash_orders DROP CONSTRAINT IF EXISTS premium_cash_orders_status_check;
ALTER TABLE premium_cash_orders ALTER COLUMN status TYPE TEXT;
ALTER TABLE premium_cash_orders 
ADD CONSTRAINT premium_cash_orders_status_check 
CHECK (status IN ('pending','awaiting_merchant','merchant_accepted','payment_sent','vendor_assigned','vendor_confirmed','out_for_delivery','completed','cancelled','disputed'));

-- 3. Add missing columns to premium_cash_orders
ALTER TABLE premium_cash_orders 
ADD COLUMN IF NOT EXISTS escrow_address TEXT,
ADD COLUMN IF NOT EXISTS vault_id TEXT,
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES auth.users(id);

-- 4. Add premium fields to trade_requests
ALTER TABLE trade_requests 
ADD COLUMN IF NOT EXISTS premium_cash_order_id UUID REFERENCES premium_cash_orders(id),
ADD COLUMN IF NOT EXISTS delivery_areas TEXT[],
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS vault_id TEXT;
ALTER TABLE trade_requests ALTER COLUMN payment_method TYPE TEXT;

-- 5. Update/Insert vendor profiles (handles duplicates)
INSERT INTO profiles (user_id, display_name, phone_number, location, bio, user_type, is_vendor) 
VALUES ('053d8388-9fed-4827-8e7e-9cd6bb77e95c', 'Ikeja Vendor Agent', '+234 801 234 5678', 'Ikeja, Lagos', 'Cash delivery agent for Ikeja area', 'vendor', true)
ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    phone_number = EXCLUDED.phone_number,
    location = EXCLUDED.location,
    bio = EXCLUDED.bio,
    user_type = EXCLUDED.user_type,
    is_vendor = EXCLUDED.is_vendor;

INSERT INTO profiles (user_id, display_name, phone_number, location, bio, user_type, is_vendor) 
VALUES ('4233b8b1-5bc4-4373-a599-69930ab79863', 'Island Vendor Agent', '+234 801 234 5679', 'Lagos Island', 'Cash delivery agent for Island area', 'vendor', true)
ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    phone_number = EXCLUDED.phone_number,
    location = EXCLUDED.location,
    bio = EXCLUDED.bio,
    user_type = EXCLUDED.user_type,
    is_vendor = EXCLUDED.is_vendor;

INSERT INTO profiles (user_id, display_name, phone_number, location, bio, user_type, is_vendor) 
VALUES ('ce474c61-0d72-4d99-9068-cd508421e6ad', 'Lekki Vendor Agent', '+234 801 234 5680', 'Lekki, Lagos', 'Cash delivery agent for Lekki area', 'vendor', true)
ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    phone_number = EXCLUDED.phone_number,
    location = EXCLUDED.location,
    bio = EXCLUDED.bio,
    user_type = EXCLUDED.user_type,
    is_vendor = EXCLUDED.is_vendor;

-- 6. Delete existing vendor entries to avoid duplicates
DELETE FROM vendors WHERE user_id IN ('053d8388-9fed-4827-8e7e-9cd6bb77e95c', '4233b8b1-5bc4-4373-a599-69930ab79863', 'ce474c61-0d72-4d99-9068-cd508421e6ad');

-- 7. Create vendor entries with address field
INSERT INTO vendors (user_id, name, location, address, phone_number, bank_name, account_number, account_name, is_active)
VALUES 
('053d8388-9fed-4827-8e7e-9cd6bb77e95c', 'Ikeja Agent', 'Ikeja', '123 Ikeja Road, Lagos', '+234 801 234 5678', 'Central Exchange Bank', '1234567890', 'TradeHub Vendor Services', true),
('4233b8b1-5bc4-4373-a599-69930ab79863', 'Island Agent', 'Lagos Island', '456 Island Street, Lagos', '+234 801 234 5679', 'Central Exchange Bank', '1234567891', 'TradeHub Vendor Services', true),
('ce474c61-0d72-4d99-9068-cd508421e6ad', 'Lekki Agent', 'Lekki', '789 Lekki Avenue, Lagos', '+234 801 234 5680', 'Central Exchange Bank', '1234567892', 'TradeHub Vendor Services', true);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trade_requests_premium_cash_order_id ON trade_requests(premium_cash_order_id);
CREATE INDEX IF NOT EXISTS idx_premium_cash_orders_merchant_id ON premium_cash_orders(merchant_id);
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_location ON vendors(location);

-- Success message
SELECT 'Vendor setup completed successfully! You can now login with vendor credentials.' as result;