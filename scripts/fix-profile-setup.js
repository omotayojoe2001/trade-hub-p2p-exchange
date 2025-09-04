#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://towffqxmmqyhbuyphkui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvd2ZmcXhtbXF5aGJ1eXBoa3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjkxMjYsImV4cCI6MjA2NzY0NTEyNn0.TOQhFmpUWX-LGf9YQl2TJEDIOT0dLG6xYslLaCcZhmY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixProfileSetup() {
  console.log('🔧 Fixing profile setup for any stuck users...\n');

  const email = process.argv[2];
  const password = process.argv[3];
  const userType = process.argv[4] || 'customer';

  if (!email || !password) {
    console.log('Usage: node scripts/fix-profile-setup.js <email> <password> [customer|merchant]');
    console.log('Example: node scripts/fix-profile-setup.js user@example.com password123 customer');
    return;
  }

  try {
    // Sign in as the user
    console.log('🔑 Signing in as:', email);
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (signInError) {
      throw signInError;
    }

    console.log('✅ Signed in successfully');
    const userId = authData.user.id;
    const userName = email.split('@')[0];

    // Force create profiles entry
    console.log('\n📋 Creating profiles entry...');
    const { error: profilesError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        display_name: userName,
        user_type: userType,
        is_merchant: userType === 'merchant',
        profile_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (profilesError) {
      console.log('❌ Profiles creation failed:', profilesError.message);
    } else {
      console.log('✅ Profiles entry created');
    }

    // Force create user_profiles entry
    console.log('\n📋 Creating user_profiles entry...');
    const { error: userProfilesError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        full_name: userName,
        is_premium: false,
        verification_level: 'basic',
        trade_count: 0,
        rating: 5.0,
        total_volume: 0,
        preferred_payment_methods: ['bank_transfer'],
        bank_accounts: [],
        crypto_addresses: {},
        settings: {
          notifications: true,
          email_alerts: true,
          sms_alerts: false
        }
      }, { onConflict: 'user_id' });

    if (userProfilesError) {
      console.log('❌ User profiles creation failed:', userProfilesError.message);
    } else {
      console.log('✅ User profiles entry created');
    }

    // Create welcome notification
    console.log('\n🔔 Creating welcome notification...');
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'success',
        title: 'Welcome to Central Exchange!',
        message: `Your ${userType} account is ready. Start trading crypto with confidence.`,
        read: false,
        data: { 
          welcome: true, 
          user_type: userType,
          is_premium: false
        }
      });

    if (notificationError) {
      console.log('⚠️  Notification creation failed:', notificationError.message);
    } else {
      console.log('✅ Welcome notification created');
    }

    // Verify the fix
    console.log('\n🔍 Verifying profile setup...');
    
    const { data: profileCheck } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: userProfileCheck } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('   profiles.profile_completed:', profileCheck?.profile_completed);
    console.log('   profiles.user_type:', profileCheck?.user_type);
    console.log('   user_profiles.full_name:', userProfileCheck?.full_name);
    console.log('   user_profiles.is_premium:', userProfileCheck?.is_premium);

    console.log('\n🎉 Profile setup fixed!');
    console.log('\n🚀 Now refresh the browser and the user should be able to access the app.');
    console.log('   The profile setup loop should be resolved.');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

fixProfileSetup();
