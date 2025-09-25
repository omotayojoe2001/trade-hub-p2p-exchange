-- FRESH VENDOR SETUP - Drop everything and start over

-- Drop tables if they exist
DROP TABLE IF EXISTS vendor_profiles CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;

-- Create vendor_profiles table (main table for cash trades)
CREATE TABLE vendor_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID, -- No foreign key constraint initially
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    phone_number TEXT,
    location TEXT NOT NULL, -- 'Mainland' or 'Island'
    address TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vendors table (for compatibility)
CREATE TABLE vendors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID, -- No foreign key constraint initially
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    location TEXT NOT NULL,
    phone_number TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vendor_profiles
CREATE POLICY "Anyone can view active vendor profiles" ON vendor_profiles
    FOR SELECT USING (is_active = true);

CREATE POLICY "Vendors can update their own profile" ON vendor_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for vendors
CREATE POLICY "Anyone can view active vendors" ON vendors
    FOR SELECT USING (is_active = true);

-- Insert fresh vendor data with placeholder user_ids
INSERT INTO vendor_profiles (user_id, email, display_name, phone_number, location, address, bank_name, account_number, account_name) VALUES
('00000000-0000-0000-0000-000000000001', 'ikeja@tradehub.com', 'Ikeja Cash Agent', '+234 803 111 1111', 'Mainland', 'Ikeja, Lagos', 'GTBank', '0123456789', 'Ikeja Cash Services'),
('00000000-0000-0000-0000-000000000002', 'island@tradehub.com', 'Island Cash Agent', '+234 803 222 2222', 'Island', 'Victoria Island, Lagos', 'Access Bank', '0987654321', 'Island Cash Services'),
('00000000-0000-0000-0000-000000000003', 'lekki@tradehub.com', 'Lekki Cash Agent', '+234 803 333 3333', 'Island', 'Lekki Phase 1, Lagos', 'Zenith Bank', '0555666777', 'Lekki Cash Services');

-- Insert into vendors table too
INSERT INTO vendors (user_id, name, email, location, phone_number) VALUES
('00000000-0000-0000-0000-000000000001', 'Ikeja Cash Services', 'ikeja@tradehub.com', 'Mainland', '+234 803 111 1111'),
('00000000-0000-0000-0000-000000000002', 'Island Cash Services', 'island@tradehub.com', 'Island', '+234 803 222 2222'),
('00000000-0000-0000-0000-000000000003', 'Lekki Cash Services', 'lekki@tradehub.com', 'Island', '+234 803 333 3333');

-- Show the fresh vendor data
SELECT 'VENDOR PROFILES:' as table_name, email, display_name, bank_name, account_number, location FROM vendor_profiles
UNION ALL
SELECT 'VENDORS:', email, name, 'N/A', 'N/A', location FROM vendors
ORDER BY table_name, email;