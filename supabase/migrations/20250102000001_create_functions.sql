-- Create functions and triggers for real-time functionality

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, full_name, is_premium, verification_level, kyc_status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        false,
        'basic',
        'pending'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to create welcome notification for new users
CREATE OR REPLACE FUNCTION public.create_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, read, data)
    VALUES (
        NEW.user_id,
        'success',
        'Welcome to Central Exchange!',
        'Your account has been created successfully. Start trading crypto with confidence.',
        false,
        jsonb_build_object('welcome', true)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for welcome notification
DROP TRIGGER IF EXISTS on_user_profile_created ON public.user_profiles;
CREATE TRIGGER on_user_profile_created
    AFTER INSERT ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.create_welcome_notification();

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
            WHEN NEW.trade_type = 'buy' THEN 
                'Someone wants to buy ' || NEW.amount || ' ' || NEW.coin_type || ' for ₦' || NEW.naira_amount
            ELSE 
                'Someone wants to sell ' || NEW.amount || ' ' || NEW.coin_type || ' for ₦' || NEW.naira_amount
        END,
        false,
        jsonb_build_object(
            'trade_request_id', NEW.id,
            'trade_type', NEW.trade_type,
            'coin_type', NEW.coin_type,
            'amount', NEW.amount,
            'naira_amount', NEW.naira_amount
        )
    FROM public.user_profiles up
    WHERE up.is_premium = true 
    AND up.user_id != NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new trade request notifications
DROP TRIGGER IF EXISTS on_trade_request_created ON public.trade_requests;
CREATE TRIGGER on_trade_request_created
    AFTER INSERT ON public.trade_requests
    FOR EACH ROW EXECUTE FUNCTION public.notify_new_trade_request();

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
            'Your ' || request_record.trade_type || ' request for ' || request_record.amount || ' ' || request_record.coin_type || ' has been accepted.',
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
            'You have accepted a ' || request_record.trade_type || ' request for ' || request_record.amount || ' ' || request_record.coin_type || '.',
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

-- Trigger for trade acceptance notifications
DROP TRIGGER IF EXISTS on_trade_created ON public.trades;
CREATE TRIGGER on_trade_created
    AFTER INSERT ON public.trades
    FOR EACH ROW EXECUTE FUNCTION public.notify_trade_accepted();

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

-- Trigger for delivery tracking notifications
DROP TRIGGER IF EXISTS on_delivery_tracking_updated ON public.delivery_tracking;
CREATE TRIGGER on_delivery_tracking_updated
    AFTER UPDATE ON public.delivery_tracking
    FOR EACH ROW EXECUTE FUNCTION public.notify_delivery_update();

-- Function to get user's recent trades
CREATE OR REPLACE FUNCTION public.get_user_recent_trades(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    trade_type TEXT,
    coin_type TEXT,
    amount NUMERIC,
    naira_amount NUMERIC,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    other_user_name TEXT,
    other_user_rating NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.trade_type,
        t.coin_type,
        t.amount,
        t.naira_amount,
        t.status,
        t.created_at,
        CASE 
            WHEN t.buyer_id = user_uuid THEN seller_profile.full_name
            ELSE buyer_profile.full_name
        END as other_user_name,
        CASE 
            WHEN t.buyer_id = user_uuid THEN seller_profile.rating
            ELSE buyer_profile.rating
        END as other_user_rating
    FROM public.trades t
    LEFT JOIN public.user_profiles buyer_profile ON t.buyer_id = buyer_profile.user_id
    LEFT JOIN public.user_profiles seller_profile ON t.seller_id = seller_profile.user_id
    WHERE t.buyer_id = user_uuid OR t.seller_id = user_uuid
    ORDER BY t.created_at DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's messages for a trade
CREATE OR REPLACE FUNCTION public.get_trade_messages(trade_uuid UUID, user_uuid UUID)
RETURNS TABLE (
    id UUID,
    sender_id UUID,
    receiver_id UUID,
    content TEXT,
    message_type TEXT,
    read BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    sender_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.sender_id,
        m.receiver_id,
        m.content,
        m.message_type,
        m.read,
        m.created_at,
        up.full_name as sender_name
    FROM public.messages m
    LEFT JOIN public.user_profiles up ON m.sender_id = up.user_id
    WHERE m.trade_id = trade_uuid 
    AND (m.sender_id = user_uuid OR m.receiver_id = user_uuid)
    ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample data for testing
INSERT INTO public.user_profiles (user_id, full_name, is_premium, verification_level, trade_count, rating, total_volume)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Demo User 1', true, 'premium', 25, 4.8, 150000),
    ('00000000-0000-0000-0000-000000000002', 'Demo User 2', true, 'premium', 18, 4.9, 89000),
    ('00000000-0000-0000-0000-000000000003', 'Demo User 3', false, 'verified', 12, 4.6, 45000)
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample trade requests for testing
INSERT INTO public.trade_requests (user_id, trade_type, coin_type, amount, naira_amount, rate, payment_method, status, expires_at)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'sell', 'BTC', 0.05, 7500000, 150000000, 'bank_transfer', 'open', now() + interval '1 hour'),
    ('00000000-0000-0000-0000-000000000002', 'buy', 'ETH', 2.5, 13375000, 5350000, 'cash_delivery', 'open', now() + interval '2 hours'),
    ('00000000-0000-0000-0000-000000000003', 'sell', 'USDT', 1000, 1550000, 1550, 'cash_pickup', 'open', now() + interval '30 minutes')
ON CONFLICT (id) DO NOTHING;

-- Insert sample notifications for testing
INSERT INTO public.notifications (user_id, type, title, message, read, data)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'trade_request', 'New Trade Request', 'Someone wants to buy 0.05 BTC from you', false, '{"trade_request_id": "sample"}'),
    ('00000000-0000-0000-0000-000000000002', 'payment_received', 'Payment Received', 'You received ₦1,500,000 for your BTC trade', false, '{"amount": 1500000}'),
    ('00000000-0000-0000-0000-000000000003', 'security', 'Security Alert', 'New device login detected', true, '{"device": "mobile"}')
ON CONFLICT (id) DO NOTHING;
