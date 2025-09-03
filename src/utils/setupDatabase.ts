import { supabase } from '@/integrations/supabase/client';

export const setupDatabase = async () => {
  console.log('🚀 Setting up sample data...');

  try {
    console.log('📋 Tables should be created manually in Supabase dashboard using SUPABASE_SETUP.sql');
    console.log('✅ Proceeding with sample data creation!');

    // Insert sample agents
    console.log('👥 Creating sample agents...');
    const { error: agentsInsertError } = await supabase
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
        },
        {
          name: 'Grace Adebayo',
          phone: '+234 804 567 8901',
          email: 'grace@tradehub.com',
          location: 'Surulere, Lagos',
          status: 'available',
          rating: 4.9,
          total_deliveries: 178,
          specialties: ['cash_pickup']
        }
      ], { onConflict: 'name' });

    if (agentsInsertError) {
      console.log('Agents insert error (might already exist):', agentsInsertError);
    } else {
      console.log('✅ Sample agents created!');
    }

    // Create sample trade requests
    console.log('💰 Creating sample trade requests...');
    const { error: tradeRequestsError } = await supabase
      .from('trade_requests')
      .upsert([
        {
          id: '11111111-1111-1111-1111-111111111111',
          user_id: '00000000-0000-0000-0000-000000000001',
          trade_type: 'sell',
          coin_type: 'BTC',
          amount: 0.05,
          naira_amount: 7500000,
          rate: 150000000,
          payment_method: 'bank_transfer',
          status: 'open',
          expires_at: new Date(Date.now() + 3600000).toISOString()
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          user_id: '00000000-0000-0000-0000-000000000002',
          trade_type: 'buy',
          coin_type: 'ETH',
          amount: 2.5,
          naira_amount: 13375000,
          rate: 5350000,
          payment_method: 'cash_delivery',
          status: 'open',
          expires_at: new Date(Date.now() + 7200000).toISOString()
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          user_id: '00000000-0000-0000-0000-000000000003',
          trade_type: 'sell',
          coin_type: 'USDT',
          amount: 1000,
          naira_amount: 1550000,
          rate: 1550,
          payment_method: 'cash_pickup',
          status: 'open',
          expires_at: new Date(Date.now() + 1800000).toISOString()
        }
      ], { onConflict: 'id' });

    if (tradeRequestsError) {
      console.log('Trade requests insert error:', tradeRequestsError);
    } else {
      console.log('✅ Sample trade requests created!');
    }

    // Create sample user profiles
    console.log('👤 Creating sample user profiles...');
    const { error: profilesInsertError } = await supabase
      .from('user_profiles')
      .upsert([
        {
          user_id: '00000000-0000-0000-0000-000000000001',
          full_name: 'Sarah Wilson',
          is_premium: true,
          verification_level: 'premium',
          trade_count: 25,
          rating: 4.8,
          total_volume: 150000
        },
        {
          user_id: '00000000-0000-0000-0000-000000000002',
          full_name: 'Mike Chen',
          is_premium: true,
          verification_level: 'premium',
          trade_count: 18,
          rating: 4.9,
          total_volume: 89000
        },
        {
          user_id: '00000000-0000-0000-0000-000000000003',
          full_name: 'John Smith',
          is_premium: false,
          verification_level: 'verified',
          trade_count: 12,
          rating: 4.6,
          total_volume: 45000
        }
      ], { onConflict: 'user_id' });

    if (profilesInsertError) {
      console.log('Profiles insert error:', profilesInsertError);
    } else {
      console.log('✅ Sample user profiles created!');
    }

    console.log('🎉 Database setup completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return false;
  }
};

export const createUserAccount = async (userId: string, email: string) => {
  try {
    console.log('👤 Creating user account for:', email);

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        full_name: email.split('@')[0] || 'User',
        is_premium: true,
        verification_level: 'premium',
        trade_count: 0,
        rating: 5.0,
        total_volume: 0,
        preferred_payment_methods: ['bank_transfer', 'cash_delivery', 'cash_pickup']
      }, { onConflict: 'user_id' });

    if (profileError) throw profileError;

    // Create welcome notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'success',
        title: 'Welcome to Central Exchange!',
        message: 'Your premium account has been set up successfully. Start trading crypto with confidence.',
        read: false,
        data: { welcome: true, is_premium: true }
      });

    if (notificationError) throw notificationError;

    // Create trade opportunity notification
    const { error: tradeNotificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'trade_request',
        title: 'Trade Opportunities Available',
        message: 'Check out the latest trade requests from verified premium users.',
        read: false,
        data: { 
          trade_type: 'info',
          priority: 'medium',
          is_premium: true
        }
      });

    if (tradeNotificationError) throw tradeNotificationError;

    console.log('✅ User account created successfully!');
    return true;

  } catch (error) {
    console.error('❌ User account creation failed:', error);
    return false;
  }
};
