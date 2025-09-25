-- Setup all required tables for sell-for-cash flow

-- 1. Ensure vendors table has all required columns
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS account_name TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Add seller phone to cash_trades
ALTER TABLE cash_trades ADD COLUMN IF NOT EXISTS seller_phone TEXT;

-- 2. Create cash_trades table if it doesn't exist
CREATE TABLE IF NOT EXISTS cash_trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trade_request_id UUID REFERENCES trade_requests(id),
    seller_id UUID REFERENCES auth.users(id),
    buyer_id UUID REFERENCES auth.users(id),
    vendor_id UUID REFERENCES vendors(id),
    usd_amount DECIMAL(15,2) NOT NULL,
    delivery_type TEXT NOT NULL CHECK (delivery_type IN ('pickup', 'delivery')),
    delivery_address TEXT,
    pickup_location TEXT,
    escrow_address TEXT,
    payment_proof_url TEXT,
    vendor_payment_proof_url TEXT,
    delivery_code TEXT,
    status TEXT DEFAULT 'pending_acceptance' CHECK (status IN (
        'pending_acceptance',
        'buyer_found',
        'vendor_paid',
        'cash_delivered',
        'completed',
        'cancelled'
    )),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create delivery_codes table for tracking cash deliveries
CREATE TABLE IF NOT EXISTS delivery_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cash_trade_id UUID REFERENCES cash_trades(id),
    code TEXT NOT NULL UNIQUE,
    seller_phone TEXT,
    vendor_id UUID REFERENCES vendors(id),
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE
);

-- 4. Ensure trade_requests table supports cash trades
ALTER TABLE trade_requests ADD COLUMN IF NOT EXISTS crypto_type TEXT;
ALTER TABLE trade_requests ADD COLUMN IF NOT EXISTS amount_crypto DECIMAL(20,8);
ALTER TABLE trade_requests ADD COLUMN IF NOT EXISTS amount_fiat DECIMAL(15,2);

-- 5. Ensure trades table supports cash trades
ALTER TABLE trades ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendors(id);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS buyer_payment_proof TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS delivery_code TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS cash_delivered_at TIMESTAMP WITH TIME ZONE;

-- 6. Update existing vendors with data from vendor_profiles if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_profiles') THEN
        UPDATE vendors 
        SET 
            display_name = COALESCE(vp.display_name, vendors.display_name),
            bank_name = COALESCE(vp.bank_name, vendors.bank_name),
            bank_account = COALESCE(vp.account_number, vendors.bank_account),
            account_name = COALESCE(vp.account_name, vendors.account_name),
            address = COALESCE(vp.address, vendors.address),
            phone_number = COALESCE(vp.phone_number, vendors.phone_number),
            location = COALESCE(vp.location, vendors.location)
        FROM vendor_profiles vp 
        WHERE vendors.email = vp.email;
    END IF;
END $$;

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cash_trades_seller_id ON cash_trades(seller_id);
CREATE INDEX IF NOT EXISTS idx_cash_trades_buyer_id ON cash_trades(buyer_id);
CREATE INDEX IF NOT EXISTS idx_cash_trades_vendor_id ON cash_trades(vendor_id);
CREATE INDEX IF NOT EXISTS idx_cash_trades_status ON cash_trades(status);
CREATE INDEX IF NOT EXISTS idx_delivery_codes_code ON delivery_codes(code);
CREATE INDEX IF NOT EXISTS idx_vendors_active ON vendors(active);
CREATE INDEX IF NOT EXISTS idx_vendors_location ON vendors(location);

-- 8. No hardcoded vendors - must be created through vendor registration

-- 9. Show table structures
SELECT 'vendors table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'vendors' 
ORDER BY ordinal_position;

SELECT 'cash_trades table created:' as info;
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'cash_trades'
) as table_exists;

SELECT 'delivery_codes table created:' as info;
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'delivery_codes'
) as table_exists;