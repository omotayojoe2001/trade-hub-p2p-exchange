#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://towffqxmmqyhbuyphkui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvd2ZmcXhtbXF5aGJ1eXBoa3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjkxMjYsImV4cCI6MjA2NzY0NTEyNn0.TOQhFmpUWX-LGf9YQl2TJEDIOT0dLG6xYslLaCcZhmY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTestUser() {
  console.log('🔍 Checking test user profile...\n');

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
    console.log('User ID:', authData.user.id);

    // Check user_profiles table
    console.log('\n📋 Checking user_profiles table...');
    const { data: userProfile, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (userProfileError) {
      console.log('❌ user_profiles error:', userProfileError.message);
    } else {
      console.log('✅ user_profiles found:');
      console.log('   Full name:', userProfile.full_name);
      console.log('   Is premium:', userProfile.is_premium);
      console.log('   Verification level:', userProfile.verification_level);
    }

    // Check profiles table (what ProfileSetup is looking for)
    console.log('\n📋 Checking profiles table...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError) {
      console.log('❌ profiles error:', profileError.message);
      console.log('   This is why ProfileSetup is stuck!');
    } else {
      console.log('✅ profiles found:');
      console.log('   Profile completed:', profile.profile_completed);
      console.log('   User type:', profile.user_type);
    }

    // Check what tables actually exist
    console.log('\n📋 Checking available tables...');
    
    // Try to list some common tables
    const tables = ['profiles', 'user_profiles', 'notifications', 'trade_requests'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        console.log(`   ${table}:`, error ? '❌ Missing' : '✅ Exists');
      } catch (e) {
        console.log(`   ${table}: ❌ Missing`);
      }
    }

    console.log('\n🎯 Solution:');
    if (profileError) {
      console.log('   Need to create a profiles table entry or');
      console.log('   Update ProfileSetup.tsx to use user_profiles table');
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkTestUser();
