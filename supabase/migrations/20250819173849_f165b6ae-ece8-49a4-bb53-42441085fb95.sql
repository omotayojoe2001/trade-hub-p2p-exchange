-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('trade_request', 'trade_accepted', 'trade_completed', 'trade_cancelled', 'payment_received', 'system_alert')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  trade_id UUID,
  metadata JSONB
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read BOOLEAN DEFAULT false
);

-- Create trade_requests table  
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

-- Create receipts table
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id UUID NOT NULL,
  trade_request_id UUID,
  receipt_type TEXT NOT NULL CHECK (receipt_type IN ('completed', 'cancelled', 'rejected', 'pending')),
  receipt_data JSONB NOT NULL,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image_url TEXT,
  author_id UUID,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  tags TEXT[]
);

-- Update trades table if exists, or create it
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_request_id UUID,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  crypto_type TEXT NOT NULL,
  crypto_amount DECIMAL(20,8) NOT NULL,
  cash_amount DECIMAL(20,2) NOT NULL,
  rate DECIMAL(20,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'payment_sent', 'payment_confirmed', 'crypto_released', 'completed', 'disputed', 'cancelled')),
  escrow_address TEXT,
  transaction_hash TEXT,
  payment_proof_url TEXT,
  bank_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 minutes')
);

-- Add RLS policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages they sent or received" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update messages they received" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- Trade requests policies
DROP POLICY IF EXISTS "Users can view all trade requests" ON public.trade_requests;
CREATE POLICY "Users can view all trade requests" ON public.trade_requests FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create their own trade requests" ON public.trade_requests;
CREATE POLICY "Users can create their own trade requests" ON public.trade_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own trade requests" ON public.trade_requests;
CREATE POLICY "Users can update their own trade requests" ON public.trade_requests FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = merchant_id);

-- Receipts policies
CREATE POLICY "Users can view receipts for their trades" ON public.receipts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM trades t 
    WHERE t.id = receipts.trade_id 
    AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
  )
);
CREATE POLICY "System can create receipts" ON public.receipts FOR INSERT WITH CHECK (true);

-- Blog posts policies
CREATE POLICY "Anyone can view published blog posts" ON public.blog_posts FOR SELECT USING (published = true);
CREATE POLICY "Authors can manage their own posts" ON public.blog_posts FOR ALL USING (auth.uid() = author_id);

-- Trades policies
DROP POLICY IF EXISTS "Users can view their own trades" ON public.trades;
CREATE POLICY "Users can view their own trades" ON public.trades FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
DROP POLICY IF EXISTS "Users can create trades" ON public.trades;
CREATE POLICY "Users can create trades" ON public.trades FOR INSERT WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);
DROP POLICY IF EXISTS "Users can update their trades" ON public.trades;
CREATE POLICY "Users can update their own trades" ON public.trades FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_trade_id ON public.messages(trade_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_requests_user_id ON public.trade_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_requests_status ON public.trade_requests(status);
CREATE INDEX IF NOT EXISTS idx_trades_buyer_id ON public.trades(buyer_id);
CREATE INDEX IF NOT EXISTS idx_trades_seller_id ON public.trades(seller_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_trades_updated_at ON public.trades;
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON public.trades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.trade_requests REPLICA IDENTITY FULL;
ALTER TABLE public.trades REPLICA IDENTITY FULL;

-- Add tables to realtime publication (safely)
DO $$
BEGIN
    -- Add notifications table if not already in publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'notifications'
    ) THEN
        ALTER publication supabase_realtime ADD TABLE public.notifications;
    END IF;

    -- Add messages table if not already in publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'messages'
    ) THEN
        ALTER publication supabase_realtime ADD TABLE public.messages;
    END IF;

    -- Add trade_requests table if not already in publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'trade_requests'
    ) THEN
        ALTER publication supabase_realtime ADD TABLE public.trade_requests;
    END IF;

    -- Add trades table if not already in publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'trades'
    ) THEN
        ALTER publication supabase_realtime ADD TABLE public.trades;
    END IF;
END $$;