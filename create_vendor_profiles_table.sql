-- Create vendor_profiles table
CREATE TABLE IF NOT EXISTS vendor_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    phone_number TEXT,
    location TEXT NOT NULL, -- 'Mainland' or 'Island'
    address TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert test vendors
INSERT INTO vendor_profiles (user_id, display_name, phone_number, location, address, bank_name, account_number, account_name) VALUES
('00000000-0000-0000-0000-000000000001', 'Ikeja Cash Agent', '+234 803 111 1111', 'Mainland', 'Ikeja, Lagos', 'GTBank', '0123456789', 'Ikeja Cash Services'),
('00000000-0000-0000-0000-000000000002', 'Island Cash Agent', '+234 803 222 2222', 'Island', 'Victoria Island, Lagos', 'Access Bank', '0987654321', 'Island Cash Services'),
('00000000-0000-0000-0000-000000000003', 'Lekki Cash Agent', '+234 803 333 3333', 'Island', 'Lekki Phase 1, Lagos', 'Zenith Bank', '0555666777', 'Lekki Cash Services');

-- Enable RLS
ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Vendors can view their own profile" ON vendor_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active vendors" ON vendor_profiles
    FOR SELECT USING (is_active = true);

CREATE POLICY "Vendors can update their own profile" ON vendor_profiles
    FOR UPDATE USING (auth.uid() = user_id);