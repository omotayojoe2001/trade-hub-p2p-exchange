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

-- Note: notify_new_trade_request function moved to first migration

-- Note: Trigger for trade_requests will be created after table exists

-- Note: notify_trade_accepted function moved to first migration

-- Note: Trigger for trades will be created after table exists

-- Note: notify_delivery_update function moved to first migration

-- Note: Trigger for delivery_tracking will be created after table exists

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

-- No sample data - using real database data only
-- All data will come from actual user signups and real trading activity
