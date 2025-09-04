#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://towffqxmmqyhbuyphkui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvd2ZmcXhtbXF5aGJ1eXBoa3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjkxMjYsImV4cCI6MjA2NzY0NTEyNn0.TOQhFmpUWX-LGf9YQl2TJEDIOT0dLG6xYslLaCcZhmY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  console.log('🚀 Creating test user and real data...\n');

  try {
    // Step 1: Create test user
    console.log('1. Creating test user...');
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: 'testuser@example.com',
      password: 'testpassword123',
    });

    if (signUpError && !signUpError.message.includes('already registered')) {
      throw signUpError;
    }

    const userId = authData.user?.id;
    if (!userId) {
      console.log('   User might already exist, trying to sign in...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'testuser@example.com',
        password: 'testpassword123',
      });
      
      if (signInError) throw signInError;
      console.log('   ✅ Signed in existing user');
    } else {
      console.log('   ✅ Test user created:', authData.user.email);
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Failed to get authenticated user');
    }

    console.log('   Current user ID:', user.id);

    // Step 2: Create user profile (this should work with RLS now)
    console.log('\n2. Creating user profile...');
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        full_name: 'Test User',
        is_premium: false, // Start as free user
        verification_level: 'basic',
        trade_count: 0,
        rating: 5.0,
        total_volume: 0,
        preferred_payment_methods: ['bank_transfer']
      }, { onConflict: 'user_id' });

    if (profileError) {
      console.log('   ❌ Profile creation failed:', profileError.message);
    } else {
      console.log('   ✅ User profile created!');
    }

    // Step 3: Create welcome notification
    console.log('\n3. Creating welcome notification...');
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'success',
        title: 'Welcome to Central Exchange!',
        message: 'Your account is ready. Start trading crypto with confidence.',
        read: false,
        data: { welcome: true, is_premium: false }
      });

    if (notificationError) {
      console.log('   ❌ Notification creation failed:', notificationError.message);
    } else {
      console.log('   ✅ Welcome notification created!');
    }

    // Step 4: Create sample trade request
    console.log('\n4. Creating sample trade request...');
    const { error: tradeError } = await supabase
      .from('trade_requests')
      .insert({
        user_id: user.id,
        crypto_type: 'BTC',
        amount: 0.01,
        cash_amount: 1500000,
        rate: 150000000,
        direction: 'crypto_to_cash',
        status: 'pending',
        expires_at: new Date(Date.now() + 3600000).toISOString()
      });

    if (tradeError) {
      console.log('   ❌ Trade request creation failed:', tradeError.message);
    } else {
      console.log('   ✅ Sample trade request created!');
    }

    // Step 5: Create sample tracking code
    console.log('\n5. Creating sample tracking code...');
    const { error: trackingError } = await supabase
      .from('tracking_codes')
      .insert({
        user_id: user.id,
        tracking_code: 'TD-2024-TEST',
        status: 'active',
        metadata: {
          delivery_type: 'cash_delivery',
          amount: 750000,
          currency: 'NGN',
          crypto_type: 'BTC',
          crypto_amount: 0.005,
          agent_name: 'Test Agent',
          agent_phone: '+234 801 234 5678',
          current_location: 'Processing'
        }
      });

    if (trackingError) {
      console.log('   ❌ Tracking code creation failed:', trackingError.message);
    } else {
      console.log('   ✅ Sample tracking code created!');
    }

    // Step 6: Test data retrieval
    console.log('\n6. Testing data retrieval...');
    
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    const { data: notificationData } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id);

    const { data: tradeData } = await supabase
      .from('trade_requests')
      .select('*')
      .eq('user_id', user.id);

    console.log('   Profile:', profileData ? '✅ Found' : '❌ Missing');
    console.log('   Notifications:', notificationData?.length || 0, 'found');
    console.log('   Trade requests:', tradeData?.length || 0, 'found');

    console.log('\n🎉 Test user setup completed!');
    console.log('\n📋 Test Credentials:');
    console.log('   Email: testuser@example.com');
    console.log('   Password: testpassword123');
    console.log('   User ID:', user.id);
    console.log('\n🚀 You can now sign in with these credentials to test real data!');

  } catch (error) {
    console.error('❌ Test user creation failed:', error.message);
  }
}

createTestUser();
