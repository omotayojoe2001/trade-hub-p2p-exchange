-- =====================================================
-- SUPABASE DATABASE SETUP FOR REAL-TIME TRADING
-- =====================================================
-- Copy and paste this SQL into your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- Paste this entire script and click "Run"

-- Create delivery_tracking table
CREATE TABLE IF NOT EXISTS public.delivery_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code TEXT UNIQUE NOT NULL,
  trade_id UUID,
  user_id UUID NOT NULL,
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('cash_delivery', 'cash_pickup')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'agent_assigned', 'in_transit', 'ready', 'completed', 'cancelled')),
  agent_id UUID,
  agent_name TEXT,
  agent_phone TEXT,
  pickup_location TEXT,
  delivery_address TEXT,
  current_location TEXT,
  estimated_arrival TIMESTAMP WITH TIME ZONE,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  crypto_type TEXT NOT NULL,
  crypto_amount NUMERIC NOT NULL,
  timeline JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create agents table
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline')),
  rating NUMERIC DEFAULT 5.0,
  total_deliveries INTEGER DEFAULT 0,
  specialties TEXT[] DEFAULT ARRAY['cash_delivery', 'cash_pickup'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create trades table
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_request_id UUID,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  coin_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  rate NUMERIC NOT NULL,
  naira_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'payment_sent', 'payment_confirmed', 'crypto_released', 'completed', 'disputed', 'cancelled')),
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  payment_method TEXT NOT NULL,
  bank_account_details JSONB,
  escrow_address TEXT,
  transaction_hash TEXT,
  payment_proof_url TEXT,
  dispute_reason TEXT,
  completion_time INTERVAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  is_premium BOOLEAN DEFAULT false,
  premium_expires_at TIMESTAMP WITH TIME ZONE,
  verification_level TEXT DEFAULT 'basic' CHECK (verification_level IN ('basic', 'verified', 'premium')),
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'submitted', 'approved', 'rejected')),
  trade_count INTEGER DEFAULT 0,
  success_rate NUMERIC DEFAULT 100.0,
  rating NUMERIC DEFAULT 5.0,
  total_volume NUMERIC DEFAULT 0,
  preferred_payment_methods TEXT[] DEFAULT ARRAY['bank_transfer'],
  bank_accounts JSONB DEFAULT '[]'::jsonb,
  crypto_addresses JSONB DEFAULT '{}'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for delivery_tracking (safe creation)
DO $$ BEGIN
  CREATE POLICY "Users can view their own delivery tracking"
    ON public.delivery_tracking FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create delivery tracking"
    ON public.delivery_tracking FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their delivery tracking"
    ON public.delivery_tracking FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS Policies for agents (safe creation)
DO $$ BEGIN
  CREATE POLICY "Agents are viewable by authenticated users"
    ON public.agents FOR SELECT
    TO authenticated;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS Policies for trades (safe creation)
DO $$ BEGIN
  CREATE POLICY "Users can view their own trades"
    ON public.trades FOR SELECT
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create trades"
    ON public.trades FOR INSERT
    WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their trades"
    ON public.trades FOR UPDATE
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS Policies for user_profiles (safe creation)
DO $$ BEGIN
  CREATE POLICY "Users can view their own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create their own profile"
    ON public.user_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_user_id ON public.delivery_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_tracking_code ON public.delivery_tracking(tracking_code);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_status ON public.delivery_tracking(status);
CREATE INDEX IF NOT EXISTS idx_agents_status ON public.agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_location ON public.agents(location);
CREATE INDEX IF NOT EXISTS idx_trades_buyer_id ON public.trades(buyer_id);
CREATE INDEX IF NOT EXISTS idx_trades_seller_id ON public.trades(seller_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_premium ON public.user_profiles(is_premium);

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns (safe creation)
DROP TRIGGER IF EXISTS update_delivery_tracking_updated_at ON public.delivery_tracking;
CREATE TRIGGER update_delivery_tracking_updated_at
    BEFORE UPDATE ON public.delivery_tracking
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_agents_updated_at ON public.agents;
CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON public.agents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_trades_updated_at ON public.trades;
CREATE TRIGGER update_trades_updated_at
    BEFORE UPDATE ON public.trades
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for new tables (safe)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_tracking;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.agents;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Insert sample agents for testing (safe - delete and recreate)
DELETE FROM public.agents WHERE name IN ('Michael Johnson', 'Sarah Williams', 'David Okafor', 'Grace Adebayo', 'James Okoro');

INSERT INTO public.agents (name, phone, email, location, status, rating, total_deliveries, specialties) VALUES
('Michael Johnson', '+234 801 234 5678', 'michael@tradehub.com', 'Victoria Island, Lagos', 'available', 4.8, 156, ARRAY['cash_delivery', 'cash_pickup']),
('Sarah Williams', '+234 802 345 6789', 'sarah@tradehub.com', 'Ikeja, Lagos', 'available', 4.9, 203, ARRAY['cash_delivery', 'cash_pickup']),
('David Okafor', '+234 803 456 7890', 'david@tradehub.com', 'Lekki, Lagos', 'available', 4.7, 89, ARRAY['cash_delivery']),
('Grace Adebayo', '+234 804 567 8901', 'grace@tradehub.com', 'Surulere, Lagos', 'available', 4.9, 178, ARRAY['cash_pickup']),
('James Okoro', '+234 805 678 9012', 'james@tradehub.com', 'Yaba, Lagos', 'available', 4.6, 134, ARRAY['cash_delivery', 'cash_pickup']);

-- Insert sample user profiles for testing (safe upsert)
INSERT INTO public.user_profiles (user_id, full_name, is_premium, verification_level, trade_count, rating, total_volume) VALUES
('00000000-0000-0000-0000-000000000001', 'Sarah Wilson', true, 'premium', 25, 4.8, 150000),
('00000000-0000-0000-0000-000000000002', 'Mike Chen', true, 'premium', 18, 4.9, 89000),
('00000000-0000-0000-0000-000000000003', 'John Smith', false, 'verified', 12, 4.6, 45000)
ON CONFLICT (user_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  is_premium = EXCLUDED.is_premium,
  verification_level = EXCLUDED.verification_level,
  trade_count = EXCLUDED.trade_count,
  rating = EXCLUDED.rating,
  total_volume = EXCLUDED.total_volume;

-- Insert sample trade requests for testing (safe upsert)
INSERT INTO public.trade_requests (id, user_id, trade_type, coin_type, amount, naira_amount, rate, payment_method, status, expires_at) VALUES
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'sell', 'BTC', 0.05, 7500000, 150000000, 'bank_transfer', 'open', now() + interval '1 hour'),
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002', 'buy', 'ETH', 2.5, 13375000, 5350000, 'cash_delivery', 'open', now() + interval '2 hours'),
('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000003', 'sell', 'USDT', 1000, 1550000, 1550, 'cash_pickup', 'open', now() + interval '30 minutes')
ON CONFLICT (id) DO UPDATE SET
  trade_type = EXCLUDED.trade_type,
  coin_type = EXCLUDED.coin_type,
  amount = EXCLUDED.amount,
  naira_amount = EXCLUDED.naira_amount,
  rate = EXCLUDED.rate,
  payment_method = EXCLUDED.payment_method,
  status = EXCLUDED.status,
  expires_at = EXCLUDED.expires_at;

-- Insert sample delivery tracking for testing (safe - delete and recreate)
DELETE FROM public.delivery_tracking WHERE tracking_code IN ('TD-2024-5678', 'TP-2024-9012');

INSERT INTO public.delivery_tracking (tracking_code, user_id, delivery_type, status, agent_name, agent_phone, amount, currency, crypto_type, crypto_amount, current_location, timeline) VALUES
('TD-2024-5678', '00000000-0000-0000-0000-000000000001', 'cash_delivery', 'in_transit', 'Michael Johnson', '+234 801 234 5678', 1500000, 'NGN', 'BTC', 0.01, 'Victoria Island, Lagos', '[
  {"step": "Order Received", "time": "2024-01-02T10:00:00Z", "completed": true},
  {"step": "Agent Assigned", "time": "2024-01-02T10:15:00Z", "completed": true},
  {"step": "Cash Prepared", "time": "2024-01-02T11:00:00Z", "completed": true},
  {"step": "Out for Delivery", "time": "2024-01-02T12:00:00Z", "completed": true},
  {"step": "Delivered", "time": null, "completed": false}
]'::jsonb),
('TP-2024-9012', '00000000-0000-0000-0000-000000000002', 'cash_pickup', 'ready', 'Sarah Williams', '+234 802 345 6789', 750000, 'NGN', 'ETH', 0.5, 'Ikeja City Mall', '[
  {"step": "Order Received", "time": "2024-01-02T09:00:00Z", "completed": true},
  {"step": "Agent Assigned", "time": "2024-01-02T09:15:00Z", "completed": true},
  {"step": "Cash Prepared", "time": "2024-01-02T10:00:00Z", "completed": true},
  {"step": "Ready for Collection", "time": "2024-01-02T10:30:00Z", "completed": true},
  {"step": "Collected", "time": null, "completed": false}
]'::jsonb);

-- Success message
SELECT 'Database setup completed successfully! You can now use real-time trading features.' as message;
