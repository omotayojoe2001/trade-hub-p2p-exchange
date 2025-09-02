-- Create comprehensive database schema for live deployment

-- Create trade_requests table
CREATE TABLE IF NOT EXISTS public.trade_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  coin_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  naira_amount NUMERIC NOT NULL,
  rate NUMERIC NOT NULL,
  payment_method TEXT,
  bank_account_details JSONB,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'matched', 'cancelled', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE,
  matched_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('trade_update', 'payment_received', 'kyc_approved', 'system_alert', 'message', 'trade_request', 'escrow', 'security', 'success')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  media_url TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create receipts table
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL,
  user_id UUID NOT NULL,
  receipt_data JSONB NOT NULL,
  receipt_url TEXT,
  receipt_type TEXT DEFAULT 'transaction' CHECK (receipt_type IN ('transaction', 'payment', 'escrow')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id UUID,
  published BOOLEAN DEFAULT false,
  featured_image TEXT,
  tags TEXT[],
  slug TEXT UNIQUE,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_sessions table for persistent flow tracking
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_data JSONB NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('trade_flow', 'premium_flow', 'onboarding', 'kyc')),
  current_step TEXT,
  completed_steps TEXT[],
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tracking_codes table for premium users
CREATE TABLE IF NOT EXISTS public.tracking_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tracking_code TEXT UNIQUE NOT NULL,
  trade_id UUID,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.trade_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trade_requests
CREATE POLICY "Users can view their own trade requests" 
  ON public.trade_requests FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() = matched_user_id);

CREATE POLICY "Users can create trade requests" 
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

-- RLS Policies for messages
CREATE POLICY "Users can view messages for their trades" 
  ON public.messages FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" 
  ON public.messages FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their messages" 
  ON public.messages FOR UPDATE 
  USING (auth.uid() = sender_id);

-- RLS Policies for receipts
CREATE POLICY "Users can view their own receipts" 
  ON public.receipts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create receipts" 
  ON public.receipts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for blog_posts
CREATE POLICY "Published blog posts are viewable by everyone" 
  ON public.blog_posts FOR SELECT 
  USING (published = true);

-- RLS Policies for user_sessions
CREATE POLICY "Users can manage their own sessions" 
  ON public.user_sessions FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for tracking_codes
CREATE POLICY "Users can view their own tracking codes" 
  ON public.tracking_codes FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create tracking codes" 
  ON public.tracking_codes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trade_requests_user_id ON public.trade_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_requests_status ON public.trade_requests(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_messages_trade_id ON public.messages(trade_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_receipts_trade_id ON public.receipts(trade_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_codes_user_id ON public.tracking_codes(user_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_trade_requests_updated_at
    BEFORE UPDATE ON public.trade_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at
    BEFORE UPDATE ON public.user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.receipts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tracking_codes;

-- Insert some sample blog posts
INSERT INTO public.blog_posts (title, content, excerpt, published, featured_image, tags, slug) VALUES
('Understanding Bitcoin Trading', 'Complete guide to Bitcoin trading strategies and market analysis...', 'Learn the fundamentals of Bitcoin trading', true, '/src/assets/blog-bitcoin-analysis.jpg', ARRAY['bitcoin', 'trading'], 'understanding-bitcoin-trading'),
('P2P Trading Security', 'Best practices for secure peer-to-peer cryptocurrency trading...', 'Security tips for P2P trading', true, '/src/assets/blog-security.jpg', ARRAY['security', 'p2p'], 'p2p-trading-security'),
('Cryptocurrency Regulation Updates', 'Latest updates on cryptocurrency regulations worldwide...', 'Stay updated with crypto regulations', true, '/src/assets/blog-regulation.jpg', ARRAY['regulation', 'legal'], 'crypto-regulation-updates');