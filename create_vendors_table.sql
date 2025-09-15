-- Drop existing vendors table if it exists
DROP TABLE IF EXISTS vendors CASCADE;

-- Create vendors table
CREATE TABLE vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  phone_number VARCHAR(20),
  rating DECIMAL(2,1) DEFAULT 5.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert sample vendors in different Lagos locations
INSERT INTO vendors (name, location, address, phone_number) VALUES
('TradeHub Ikeja', 'Ikeja', 'Allen Avenue, Ikeja, Lagos', '+234 801 234 5678'),
('TradeHub Yaba', 'Yaba', 'Herbert Macaulay Way, Yaba, Lagos', '+234 802 345 6789'),
('TradeHub Airport Road', 'Airport Road', 'Murtala Mohammed Airport Road, Lagos', '+234 803 456 7890'),
('TradeHub Lagos Island', 'Lagos Island', 'Marina Street, Lagos Island', '+234 804 567 8901'),
('TradeHub Lekki', 'Lekki', 'Admiralty Way, Lekki Phase 1, Lagos', '+234 805 678 9012'),
('TradeHub Ajah', 'Ajah', 'Lekki-Epe Expressway, Ajah, Lagos', '+234 806 789 0123');

-- Enable RLS
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read vendors
CREATE POLICY "Allow all users to read vendors" ON vendors
  FOR SELECT USING (true);