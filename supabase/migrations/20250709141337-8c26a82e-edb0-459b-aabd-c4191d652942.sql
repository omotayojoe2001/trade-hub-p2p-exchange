-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  phone_number TEXT,
  is_merchant BOOLEAN DEFAULT false,
  user_type TEXT DEFAULT 'customer' CHECK (user_type IN ('customer', 'merchant')),
  profile_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create trades table
CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL,
  seller_id UUID,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  coin_type TEXT NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  naira_amount DECIMAL(20,2) NOT NULL,
  rate DECIMAL(20,8) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'waiting_payment', 'payment_sent', 'waiting_confirmation', 'escrow_released', 'completed', 'cancelled', 'failed')),
  payment_method TEXT,
  bank_account_details JSONB,
  transaction_id TEXT,
  receipt_url TEXT,
  notes TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create trade updates table for tracking status changes
CREATE TABLE public.trade_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  updated_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create referrals table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  reward_amount DECIMAL(20,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for trades
CREATE POLICY "Users can view their own trades" ON public.trades
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create trades" ON public.trades
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update their own trades" ON public.trades
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Create policies for trade updates
CREATE POLICY "Users can view trade updates for their trades" ON public.trade_updates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trades 
      WHERE id = trade_id AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can create trade updates" ON public.trade_updates
  FOR INSERT WITH CHECK (auth.uid() = updated_by);

-- Create policies for referrals
CREATE POLICY "Users can view their referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can create referrals" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trades_updated_at
  BEFORE UPDATE ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert some demo trades
INSERT INTO public.trades (buyer_id, trade_type, coin_type, amount, naira_amount, rate, status, is_demo, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'buy', 'BTC', 0.0045, 520000, 115555555.56, 'waiting_payment', true, now() - interval '2 hours'),
  ('00000000-0000-0000-0000-000000000001', 'sell', 'USDT', 500, 730500, 1461, 'waiting_confirmation', true, now() - interval '1 hour'),
  ('00000000-0000-0000-0000-000000000001', 'buy', 'BTC', 0.0089, 1250000, 140449438.20, 'completed', true, now() - interval '1 day');