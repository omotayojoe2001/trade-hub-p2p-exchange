#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://towffqxmmqyhbuyphkui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvd2ZmcXhtbXF5aGJ1eXBoa3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjkxMjYsImV4cCI6MjA2NzY0NTEyNn0.TOQhFmpUWX-LGf9YQl2TJEDIOT0dLG6xYslLaCcZhmY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTestUserProfile() {
  console.log('🔧 Fixing test user profile...\n');

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

    // Ensure profiles table has correct entry
    console.log('\n📋 Updating profiles table...');
    const { error: profilesError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        display_name: 'Test User',
        username: 'testuser',
        user_type: 'customer',
        profile_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (profilesError) {
      console.log('❌ Profiles update failed:', profilesError.message);
    } else {
      console.log('✅ Profiles table updated');
    }

    // Ensure user_profiles table has correct entry
    console.log('\n📋 Updating user_profiles table...');
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
      console.log('✅ User profiles table updated');
    }

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    
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
    console.log('   user_profiles.full_name:', userProfileCheck?.full_name);
    console.log('   user_profiles.is_premium:', userProfileCheck?.is_premium);

    console.log('\n🎉 Test user profile fixed!');
    console.log('\n📋 You can now sign in with:');
    console.log('   Email: testuser@example.com');
    console.log('   Password: testpassword123');
    console.log('\n🚀 The app should now work properly!');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

fixTestUserProfile();
