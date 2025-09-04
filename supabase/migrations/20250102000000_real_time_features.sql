-- Real-time features migration for live trading system

-- Create delivery_tracking table for real tracking codes
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

-- Create agents table for real agent assignment
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

-- Create trades table for real trade management
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

-- Create user_profiles table for enhanced user data
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

-- Create trade_requests table for P2P trading
CREATE TABLE IF NOT EXISTS public.trade_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  merchant_id UUID,
  crypto_type TEXT NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  rate DECIMAL(20,2) NOT NULL,
  cash_amount DECIMAL(20,2) NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('crypto_to_cash', 'cash_to_crypto')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  bank_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 hour'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create notifications table for real-time alerts
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read BOOLEAN DEFAULT false
);

-- Enable RLS on new tables
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for delivery_tracking
CREATE POLICY "Users can view their own delivery tracking" 
  ON public.delivery_tracking FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create delivery tracking" 
  ON public.delivery_tracking FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their delivery tracking" 
  ON public.delivery_tracking FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS Policies for agents (read-only for users)
CREATE POLICY "Agents are viewable by authenticated users" 
  ON public.agents FOR SELECT 
  TO authenticated;

-- RLS Policies for trades
CREATE POLICY "Users can view their own trades" 
  ON public.trades FOR SELECT 
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create trades" 
  ON public.trades FOR INSERT 
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can update their trades" 
  ON public.trades FOR UPDATE 
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" 
  ON public.user_profiles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
  ON public.user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for trade_requests
CREATE POLICY "Users can view all trade requests"
  ON public.trade_requests FOR SELECT
  TO authenticated;

CREATE POLICY "Users can create their own trade requests"
  ON public.trade_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trade requests"
  ON public.trade_requests FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

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
CREATE INDEX IF NOT EXISTS idx_trade_requests_user_id ON public.trade_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_requests_status ON public.trade_requests(status);
CREATE INDEX IF NOT EXISTS idx_trade_requests_crypto_type ON public.trade_requests(crypto_type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- Create the update_updated_at_column function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_delivery_tracking_updated_at
    BEFORE UPDATE ON public.delivery_tracking
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON public.agents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trades_updated_at
    BEFORE UPDATE ON public.trades
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_tracking;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Insert sample agents for testing
INSERT INTO public.agents (name, phone, email, location, status, rating, total_deliveries, specialties) VALUES
('Michael Johnson', '+234 801 234 5678', 'michael@tradehub.com', 'Victoria Island, Lagos', 'available', 4.8, 156, ARRAY['cash_delivery', 'cash_pickup']),
('Sarah Williams', '+234 802 345 6789', 'sarah@tradehub.com', 'Ikeja, Lagos', 'available', 4.9, 203, ARRAY['cash_delivery', 'cash_pickup']),
('David Okafor', '+234 803 456 7890', 'david@tradehub.com', 'Lekki, Lagos', 'available', 4.7, 89, ARRAY['cash_delivery']),
('Grace Adebayo', '+234 804 567 8901', 'grace@tradehub.com', 'Surulere, Lagos', 'available', 4.9, 178, ARRAY['cash_pickup']),
('James Okoro', '+234 805 678 9012', 'james@tradehub.com', 'Yaba, Lagos', 'available', 4.6, 134, ARRAY['cash_delivery', 'cash_pickup']);

-- Create function to generate tracking codes
CREATE OR REPLACE FUNCTION generate_tracking_code(delivery_type TEXT)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    year_part TEXT;
    random_part TEXT;
    tracking_code TEXT;
BEGIN
    -- Set prefix based on delivery type
    IF delivery_type = 'cash_delivery' THEN
        prefix := 'TD';
    ELSIF delivery_type = 'cash_pickup' THEN
        prefix := 'TP';
    ELSE
        prefix := 'TX';
    END IF;
    
    -- Get current year
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;
    
    -- Generate random 4-digit number
    random_part := LPAD((RANDOM() * 9999)::INTEGER::TEXT, 4, '0');
    
    -- Combine parts
    tracking_code := prefix || '-' || year_part || '-' || random_part;
    
    RETURN tracking_code;
END;
$$ LANGUAGE plpgsql;

-- Create function to assign agent automatically
CREATE OR REPLACE FUNCTION assign_agent(delivery_location TEXT, delivery_type TEXT)
RETURNS UUID AS $$
DECLARE
    agent_id UUID;
BEGIN
    -- Find available agent in the area with matching specialty
    SELECT id INTO agent_id
    FROM public.agents
    WHERE status = 'available'
    AND delivery_type = ANY(specialties)
    AND location ILIKE '%' || delivery_location || '%'
    ORDER BY rating DESC, total_deliveries ASC
    LIMIT 1;
    
    -- If no specific location match, get any available agent
    IF agent_id IS NULL THEN
        SELECT id INTO agent_id
        FROM public.agents
        WHERE status = 'available'
        AND delivery_type = ANY(specialties)
        ORDER BY rating DESC, total_deliveries ASC
        LIMIT 1;
    END IF;
    
    RETURN agent_id;
END;
$$ LANGUAGE plpgsql;

-- Create notification functions for triggers
-- Function to notify users of new trade requests
CREATE OR REPLACE FUNCTION public.notify_new_trade_request()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify all premium users about new trade requests
    INSERT INTO public.notifications (user_id, type, title, message, read, data)
    SELECT
        up.user_id,
        'trade_request',
        'New Trade Request Available',
        CASE
            WHEN NEW.direction = 'cash_to_crypto' THEN
                'Someone wants to buy ' || NEW.amount || ' ' || NEW.crypto_type || ' for ₦' || NEW.cash_amount
            ELSE
                'Someone wants to sell ' || NEW.amount || ' ' || NEW.crypto_type || ' for ₦' || NEW.cash_amount
        END,
        false,
        jsonb_build_object(
            'trade_request_id', NEW.id,
            'direction', NEW.direction,
            'crypto_type', NEW.crypto_type,
            'amount', NEW.amount,
            'cash_amount', NEW.cash_amount
        )
    FROM public.user_profiles up
    WHERE up.is_premium = true
    AND up.user_id != NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to notify when trade is accepted
CREATE OR REPLACE FUNCTION public.notify_trade_accepted()
RETURNS TRIGGER AS $$
DECLARE
    request_record RECORD;
BEGIN
    -- Get the trade request details
    SELECT * INTO request_record
    FROM public.trade_requests
    WHERE id = NEW.trade_request_id;

    IF FOUND THEN
        -- Notify the original requester
        INSERT INTO public.notifications (user_id, type, title, message, read, data)
        VALUES (
            request_record.user_id,
            'trade_update',
            'Trade Request Accepted!',
            'Your ' || request_record.direction || ' request for ' || request_record.amount || ' ' || request_record.crypto_type || ' has been accepted.',
            false,
            jsonb_build_object(
                'trade_id', NEW.id,
                'trade_request_id', NEW.trade_request_id,
                'status', NEW.status
            )
        );

        -- Notify the accepter
        INSERT INTO public.notifications (user_id, type, title, message, read, data)
        VALUES (
            CASE
                WHEN NEW.buyer_id = request_record.user_id THEN NEW.seller_id
                ELSE NEW.buyer_id
            END,
            'trade_update',
            'Trade Started!',
            'You have accepted a ' || request_record.direction || ' request for ' || request_record.amount || ' ' || request_record.crypto_type || '.',
            false,
            jsonb_build_object(
                'trade_id', NEW.id,
                'trade_request_id', NEW.trade_request_id,
                'status', NEW.status
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to notify delivery tracking updates
CREATE OR REPLACE FUNCTION public.notify_delivery_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify on status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.notifications (user_id, type, title, message, read, data)
        VALUES (
            NEW.user_id,
            'trade_update',
            'Delivery Update',
            'Your ' || REPLACE(NEW.delivery_type, '_', ' ') || ' status has been updated to: ' || REPLACE(NEW.status, '_', ' '),
            false,
            jsonb_build_object(
                'tracking_code', NEW.tracking_code,
                'delivery_tracking_id', NEW.id,
                'status', NEW.status,
                'delivery_type', NEW.delivery_type
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create additional triggers for real-time notifications
-- (These need to be created after tables exist)

-- Trigger for new trade request notifications
DROP TRIGGER IF EXISTS on_trade_request_created ON public.trade_requests;
CREATE TRIGGER on_trade_request_created
    AFTER INSERT ON public.trade_requests
    FOR EACH ROW EXECUTE FUNCTION public.notify_new_trade_request();

-- Trigger for trade acceptance notifications
DROP TRIGGER IF EXISTS on_trade_created ON public.trades;
CREATE TRIGGER on_trade_created
    AFTER INSERT ON public.trades
    FOR EACH ROW EXECUTE FUNCTION public.notify_trade_accepted();

-- Trigger for delivery tracking notifications
DROP TRIGGER IF EXISTS on_delivery_tracking_updated ON public.delivery_tracking;
CREATE TRIGGER on_delivery_tracking_updated
    AFTER UPDATE ON public.delivery_tracking
    FOR EACH ROW EXECUTE FUNCTION public.notify_delivery_update();

-- Success message
SELECT 'Database setup completed successfully! You can now use real-time trading features.' as message;
