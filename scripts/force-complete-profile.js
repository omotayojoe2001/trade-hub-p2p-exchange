#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://towffqxmmqyhbuyphkui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvd2ZmcXhtbXF5aGJ1eXBoa3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjkxMjYsImV4cCI6MjA2NzY0NTEyNn0.TOQhFmpUWX-LGf9YQl2TJEDIOT0dLG6xYslLaCcZhmY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceCompleteProfile() {
  console.log('🔧 Force completing profile for test user...\n');

  try {
    // Sign in as test user
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'testuser@example.com',
      password: 'testpassword123',
    });

    if (signInError) {
      throw signInError;
    }

    console.log('✅ Signed in as test user');
    const userId = authData.user.id;

    // Force update profiles table
    console.log('\n📋 Force updating profiles table...');
    const { error: profilesError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        display_name: 'Test User',
        user_type: 'customer',
        is_merchant: false,
        profile_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (profilesError) {
      console.log('❌ Profiles update failed:', profilesError.message);
    } else {
      console.log('✅ Profiles table force updated');
    }

    // Force update user_profiles table
    console.log('\n📋 Force updating user_profiles table...');
    const { error: userProfilesError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        full_name: 'Test User',
        is_premium: false,
        verification_level: 'basic',
        trade_count: 0,
        rating: 5.0,
        total_volume: 0,
        preferred_payment_methods: ['bank_transfer']
      }, { onConflict: 'user_id' });

    if (userProfilesError) {
      console.log('❌ User profiles update failed:', userProfilesError.message);
    } else {
      console.log('✅ User profiles table force updated');
    }

    // Verify the fix
    console.log('\n🔍 Verifying profile completion...');
    
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

    console.log('\n🎉 Profile force completed!');
    console.log('\n🚀 Now try refreshing the browser and signing in again.');
    console.log('   The redirect loop should be fixed!');

  } catch (error) {
    console.error('❌ Force completion failed:', error.message);
  }
}

forceCompleteProfile();
