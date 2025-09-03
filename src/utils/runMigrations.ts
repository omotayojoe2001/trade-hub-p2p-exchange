import { supabase } from '@/integrations/supabase/client';

export const runMigrations = async () => {
  try {
    console.log('Running database migrations...');
    
    // Create the tables first
    const createTablesSQL = `
      -- Create delivery_tracking table if not exists
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

      -- Create agents table if not exists
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

      -- Create trades table if not exists
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

      -- Create user_profiles table if not exists
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
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTablesSQL });
    if (createError) {
      console.log('Tables might already exist, continuing...');
    }

    // Insert sample agents
    const { error: agentsError } = await supabase
      .from('agents')
      .upsert([
        {
          name: 'Michael Johnson',
          phone: '+234 801 234 5678',
          email: 'michael@tradehub.com',
          location: 'Victoria Island, Lagos',
          status: 'available',
          rating: 4.8,
          total_deliveries: 156,
          specialties: ['cash_delivery', 'cash_pickup']
        },
        {
          name: 'Sarah Williams',
          phone: '+234 802 345 6789',
          email: 'sarah@tradehub.com',
          location: 'Ikeja, Lagos',
          status: 'available',
          rating: 4.9,
          total_deliveries: 203,
          specialties: ['cash_delivery', 'cash_pickup']
        },
        {
          name: 'David Okafor',
          phone: '+234 803 456 7890',
          email: 'david@tradehub.com',
          location: 'Lekki, Lagos',
          status: 'available',
          rating: 4.7,
          total_deliveries: 89,
          specialties: ['cash_delivery']
        }
      ], { onConflict: 'name' });

    if (agentsError) {
      console.log('Agents insert error (might already exist):', agentsError);
    }

    console.log('Migrations completed successfully!');
    return true;
  } catch (error) {
    console.error('Migration error:', error);
    return false;
  }
};

export const createSampleData = async () => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Create user profile if not exists
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        full_name: user.email?.split('@')[0] || 'User',
        is_premium: true,
        verification_level: 'premium',
        trade_count: 0,
        rating: 5.0,
        total_volume: 0
      }, { onConflict: 'user_id' });

    if (profileError) {
      console.log('Profile creation error:', profileError);
    }

    // Create welcome notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'success',
        title: 'Welcome to Central Exchange!',
        message: 'Your account has been set up successfully. Start trading crypto with confidence.',
        read: false,
        data: { welcome: true }
      });

    if (notificationError) {
      console.log('Notification creation error:', notificationError);
    }

    return true;
  } catch (error) {
    console.error('Sample data creation error:', error);
    return false;
  }
};
