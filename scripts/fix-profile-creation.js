#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://towffqxmmqyhbuyphkui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvd2ZmcXhtbXF5aGJ1eXBoa3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjkxMjYsImV4cCI6MjA2NzY0NTEyNn0.TOQhFmpUWX-LGf9YQl2TJEDIOT0dLG6xYslLaCcZhmY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixProfileCreation() {
  console.log('🔧 Diagnosing Profile Creation Issue...\n');

  try {
    // Step 1: Check if profiles table exists and is accessible
    console.log('1. Checking profiles table access...');
    
    const { data: profilesTest, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (profilesError) {
      console.log('   ❌ Cannot access profiles table:', profilesError.message);
      console.log('   💡 This might be due to RLS policies or table permissions');
    } else {
      console.log('   ✅ Profiles table accessible');
    }

    // Step 2: Check auth users
    console.log('\n2. Checking authenticated users...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('   ❌ No authenticated user:', authError.message);
      console.log('   💡 Users need to be logged in for profile creation to work');
    } else if (user) {
      console.log('   ✅ Found authenticated user:', user.email);
      
      // Try to create profile for this user
      console.log('\n3. Testing profile creation for current user...');
      
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.log('   ❌ Error checking existing profile:', checkError.message);
      } else if (existingProfile) {
        console.log('   ✅ Profile already exists for this user');
        console.log('   📝 Profile data:', {
          display_name: existingProfile.display_name,
          user_type: existingProfile.user_type,
          is_merchant: existingProfile.is_merchant
        });
      } else {
        console.log('   ⚠️  No profile found, attempting to create...');
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            display_name: user.email?.split('@')[0] || 'User',
            user_type: 'customer',
            is_merchant: false,
            profile_completed: true
          })
          .select()
          .single();

        if (createError) {
          console.log('   ❌ Profile creation failed:', createError.message);
          console.log('   💡 This confirms there\'s an RLS or permission issue');
        } else {
          console.log('   ✅ Profile created successfully!');
          console.log('   📝 New profile:', newProfile);
        }
      }
    } else {
      console.log('   ⚠️  No authenticated user found');
    }

    // Step 3: Provide solutions
    console.log('\n🎯 Diagnosis & Solutions:');
    
    if (profilesError) {
      console.log('   ❌ ISSUE: Cannot access profiles table');
      console.log('   💡 SOLUTION: Check RLS policies in Supabase dashboard');
      console.log('   🔧 FIX: Ensure profiles table allows INSERT for authenticated users');
    }

    if (!user) {
      console.log('   ❌ ISSUE: No authenticated user');
      console.log('   💡 SOLUTION: Users must sign up and log in first');
      console.log('   🔧 FIX: Have User A and User B sign up through the app');
    }

    console.log('\n📋 Manual Fix Steps:');
    console.log('   1. Go to Supabase Dashboard → Authentication → Users');
    console.log('   2. Check if users exist in auth.users table');
    console.log('   3. Go to Table Editor → profiles table');
    console.log('   4. Check RLS policies allow authenticated users to INSERT');
    console.log('   5. If needed, temporarily disable RLS to test');

    console.log('\n🚀 Testing Steps:');
    console.log('   1. User A: Sign up through the app');
    console.log('   2. Check if profile appears in profiles table');
    console.log('   3. User A: Toggle merchant mode ON');
    console.log('   4. Check if is_merchant becomes true in database');
    console.log('   5. User B: Sign up and check merchant list');

    // Step 4: Check RLS policies
    console.log('\n4. Checking RLS policies...');
    console.log('   💡 If profiles are not being created, the issue is likely:');
    console.log('   • RLS policies are too restrictive');
    console.log('   • useUserSetup hook is not being called');
    console.log('   • Authentication state is not properly set');
    console.log('   • Profile creation is failing silently');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
  }
}

// Run the diagnosis
fixProfileCreation().then(() => {
  console.log('\n✨ Profile creation diagnosis completed!');
}).catch(error => {
  console.error('Diagnosis failed:', error);
});
