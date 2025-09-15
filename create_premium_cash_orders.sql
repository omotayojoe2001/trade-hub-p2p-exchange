-- Create premium_cash_orders table
CREATE TABLE IF NOT EXISTS premium_cash_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crypto_type VARCHAR(10) NOT NULL,
  crypto_amount DECIMAL(20,8) NOT NULL,
  naira_amount DECIMAL(15,2) NOT NULL,
  delivery_type VARCHAR(20) NOT NULL CHECK (delivery_type IN ('delivery', 'pickup')),
  
  -- Delivery details
  delivery_address TEXT,
  delivery_city VARCHAR(100),
  delivery_state VARCHAR(100),
  delivery_landmark TEXT,
  
  -- Contact details
  phone_number VARCHAR(20) NOT NULL,
  whatsapp_number VARCHAR(20),
  
  -- Date/Time
  preferred_date DATE NOT NULL,
  preferred_time VARCHAR(20) NOT NULL,
  
  -- Vendor assignment
  selected_areas TEXT[], -- Array of selected areas
  assigned_vendor_id UUID REFERENCES vendors(id),
  
  -- Trade details
  trade_request_id UUID,
  merchant_id UUID REFERENCES auth.users(id),
  escrow_address TEXT,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'merchant_matched', 'payment_sent', 'vendor_confirmed', 'delivered', 'completed', 'cancelled')),
  
  -- Points
  points_deducted INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE premium_cash_orders ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own orders" ON premium_cash_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON premium_cash_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" ON premium_cash_orders
  FOR UPDATE USING (auth.uid() = user_id);

-- Vendors can view assigned orders
CREATE POLICY "Vendors can view assigned orders" ON premium_cash_orders
  FOR SELECT USING (assigned_vendor_id IN (
    SELECT id FROM vendors WHERE phone_number = (
      SELECT phone_number FROM profiles WHERE user_id = auth.uid()
    )
  ));

-- Add indexes
CREATE INDEX idx_premium_cash_orders_user_id ON premium_cash_orders(user_id);
CREATE INDEX idx_premium_cash_orders_vendor_id ON premium_cash_orders(assigned_vendor_id);
CREATE INDEX idx_premium_cash_orders_status ON premium_cash_orders(status);