#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://towffqxmmqyhbuyphkui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvd2ZmcXhtbXF5aGJ1eXBoa3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjkxMjYsImV4cCI6MjA2NzY0NTEyNn0.TOQhFmpUWX-LGf9YQl2TJEDIOT0dLG6xYslLaCcZhmY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMerchantToggleDirect() {
  console.log('🧪 Testing Merchant Toggle Directly...\n');

  try {
    // Step 1: Check current users
    console.log('1. Checking current users in profiles table...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.log('   ❌ Error fetching profiles:', profilesError.message);
      return;
    }

    console.log(`   ✅ Found ${profiles.length} users:`);
    profiles.forEach((profile, index) => {
      console.log(`     ${index + 1}. ${profile.display_name || 'Unknown'}`);
      console.log(`        ID: ${profile.user_id.slice(0, 8)}...`);
      console.log(`        Type: ${profile.user_type}`);
      console.log(`        Is Merchant: ${profile.is_merchant}`);
      console.log('');
    });

    if (profiles.length === 0) {
      console.log('   ⚠️  No users found. Users need to sign up first.');
      return;
    }

    // Step 2: Try to manually toggle merchant mode for first user
    const testUser = profiles[0];
    console.log(`2. Testing merchant toggle for ${testUser.display_name}...`);
    
    const newMerchantStatus = !testUser.is_merchant;
    console.log(`   Attempting to set merchant mode to: ${newMerchantStatus}`);

    // Test direct update to profiles table
    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update({
        user_type: newMerchantStatus ? 'merchant' : 'customer',
        is_merchant: newMerchantStatus,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', testUser.user_id)
      .select();

    if (updateError) {
      console.log('   ❌ Update failed:', updateError.message);
      console.log('   💡 This might be due to RLS policies or permissions');
      
      // Check RLS policies
      console.log('\n   🔍 Checking RLS policies...');
      console.log('   The update might be blocked because:');
      console.log('   • RLS policies require authentication');
      console.log('   • User needs to be logged in to update their own profile');
      console.log('   • Anonymous updates are not allowed');
      
    } else {
      console.log('   ✅ Update successful!');
      console.log('   📝 Updated data:', updateResult);
    }

    // Step 3: Check if merchant settings can be created
    if (newMerchantStatus) {
      console.log('\n3. Testing merchant settings creation...');
      
      const { data: settingsResult, error: settingsError } = await supabase
        .from('merchant_settings')
        .upsert({
          user_id: testUser.user_id,
          merchant_type: 'manual',
          is_online: true,
          accepts_new_trades: true,
          avg_response_time_minutes: 10,
          payment_methods: ['bank_transfer'],
          min_trade_amount: 1000,
          max_trade_amount: 10000000,
          auto_accept_trades: false,
          auto_release_escrow: false
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })
        .select();

      if (settingsError) {
        console.log('   ❌ Merchant settings creation failed:', settingsError.message);
      } else {
        console.log('   ✅ Merchant settings created successfully!');
      }
    }

    // Step 4: Verify the changes
    console.log('\n4. Verifying changes...');
    
    const { data: updatedProfiles, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', testUser.user_id)
      .single();

    if (verifyError) {
      console.log('   ❌ Verification failed:', verifyError.message);
    } else {
      console.log('   ✅ Current profile state:');
      console.log(`     Name: ${updatedProfiles.display_name}`);
      console.log(`     Type: ${updatedProfiles.user_type}`);
      console.log(`     Is Merchant: ${updatedProfiles.is_merchant}`);
      console.log(`     Updated: ${updatedProfiles.updated_at}`);
    }

    // Step 5: Test merchant discovery
    console.log('\n5. Testing merchant discovery...');
    
    const { data: merchants, error: merchantError } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_merchant', true);

    if (merchantError) {
      console.log('   ❌ Merchant discovery failed:', merchantError.message);
    } else {
      console.log(`   ✅ Found ${merchants.length} merchants:`);
      merchants.forEach(merchant => {
        console.log(`     - ${merchant.display_name} (${merchant.user_type})`);
      });
    }

    // Step 6: Recommendations
    console.log('\n🎯 Diagnosis:');
    
    if (updateError) {
      console.log('   ❌ ISSUE: Cannot update profiles table');
      console.log('   💡 SOLUTION: The merchant toggle needs to work through authenticated requests');
      console.log('   🔧 FIX: Users must be logged in when toggling merchant mode');
      console.log('');
      console.log('   📋 Manual Fix Steps:');
      console.log('   1. User A: Sign up and log in');
      console.log('   2. User A: Use the merchant toggle in the app (not this script)');
      console.log('   3. Check if the toggle works through the authenticated app');
      console.log('   4. If still not working, check browser console for errors');
    } else {
      console.log('   ✅ Profile updates work');
      console.log('   💡 The merchant toggle should work in the app');
    }

    console.log('\n🚀 Next Steps:');
    console.log('   1. User A: Log into the app');
    console.log('   2. User A: Go to settings and toggle merchant mode ON');
    console.log('   3. Check Supabase profiles table - should see is_merchant=true');
    console.log('   4. User B: Check merchant list - should see User A');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testMerchantToggleDirect().then(() => {
  console.log('\n✨ Direct toggle test completed!');
}).catch(error => {
  console.error('Test failed:', error);
});
