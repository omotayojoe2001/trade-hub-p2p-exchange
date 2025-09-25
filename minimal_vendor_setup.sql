-- Minimal vendor setup - just create table and insert data

CREATE TABLE vendor_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    phone_number TEXT,
    location TEXT NOT NULL,
    address TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO vendor_profiles (user_id, email, display_name, phone_number, location, address, bank_name, account_number, account_name) VALUES
('00000000-0000-0000-0000-000000000001', 'ikeja@tradehub.com', 'Ikeja Cash Agent', '+234 803 111 1111', 'Mainland', 'Ikeja, Lagos', 'GTBank', '0123456789', 'Ikeja Cash Services'),
('00000000-0000-0000-0000-000000000002', 'island@tradehub.com', 'Island Cash Agent', '+234 803 222 2222', 'Island', 'Victoria Island, Lagos', 'Access Bank', '0987654321', 'Island Cash Services'),
('00000000-0000-0000-0000-000000000003', 'lekki@tradehub.com', 'Lekki Cash Agent', '+234 803 333 3333', 'Island', 'Lekki Phase 1, Lagos', 'Zenith Bank', '0555666777', 'Lekki Cash Services');