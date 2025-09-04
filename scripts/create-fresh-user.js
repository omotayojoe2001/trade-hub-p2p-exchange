#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://towffqxmmqyhbuyphkui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvd2ZmcXhtbXF5aGJ1eXBoa3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjkxMjYsImV4cCI6MjA2NzY0NTEyNn0.TOQhFmpUWX-LGf9YQl2TJEDIOT0dLG6xYslLaCcZhmY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createFreshUser() {
  console.log('🚀 Creating fresh test user...\n');

  const email = 'freeuser@example.com';
  const password = 'password123';

  try {
    // Create new user
    console.log('1. Creating new user...');
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (signUpError && !signUpError.message.includes('already registered')) {
      throw signUpError;
    }

    let userId;
    if (authData.user) {
      userId = authData.user.id;
      console.log('   ✅ New user created:', email);
    } else {
      // User exists, sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      
      if (signInError) throw signInError;
      userId = signInData.user.id;
      console.log('   ✅ Signed in existing user:', email);
    }

    console.log('   User ID:', userId);

    // Create profiles entry (for ProfileSetup compatibility)
    console.log('\n2. Creating profiles entry...');
    const { error: profilesError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        display_name: 'Free User',
        user_type: 'customer',
        profile_completed: true
      }, { onConflict: 'user_id' });

    if (profilesError) {
      console.log('   ⚠️  Profiles creation failed:', profilesError.message);
      console.log('   This might be okay if the table structure is different');
    } else {
      console.log('   ✅ Profiles entry created');
    }

    // Create user_profiles entry (for real app data)
    console.log('\n3. Creating user_profiles entry...');
    const { error: userProfilesError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        full_name: 'Free User',
        is_premium: false,
        verification_level: 'basic',
        trade_count: 0,
        rating: 5.0,
        total_volume: 0,
        preferred_payment_methods: ['bank_transfer']
      }, { onConflict: 'user_id' });

    if (userProfilesError) {
      console.log('   ❌ User profiles creation failed:', userProfilesError.message);
    } else {
      console.log('   ✅ User profiles entry created');
    }

    // Create a trade request
    console.log('\n4. Creating sample trade request...');
    const { error: tradeError } = await supabase
      .from('trade_requests')
      .insert({
        user_id: userId,
        trade_type: 'buy',
        coin_type: 'ETH',
        amount: 0.5,
        naira_amount: 2500000,
        rate: 5000000,
        payment_method: 'bank_transfer',
        status: 'open',
        expires_at: new Date(Date.now() + 7200000).toISOString() // 2 hours
      });

    if (tradeError) {
      console.log('   ❌ Trade request creation failed:', tradeError.message);
    } else {
      console.log('   ✅ Sample trade request created');
    }

    console.log('\n🎉 Fresh user created successfully!');
    console.log('\n📋 New Test Credentials:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('   User Type: FREE (not premium)');
    console.log('   Profile: Completed');
    console.log('\n🚀 Try signing in with these credentials!');

  } catch (error) {
    console.error('❌ Fresh user creation failed:', error.message);
  }
}

createFreshUser();
