#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://towffqxmmqyhbuyphkui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvd2ZmcXhtbXF5aGJ1eXBoa3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjkxMjYsImV4cCI6MjA2NzY0NTEyNn0.TOQhFmpUWX-LGf9YQl2TJEDIOT0dLG6xYslLaCcZhmY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCurrentUsers() {
  console.log('🔍 Debugging Current Users and Merchant Discovery...\n');

  try {
    // Step 1: Check profiles table
    console.log('1. Checking profiles table...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.log('   ❌ Error accessing profiles:', profilesError.message);
    } else {
      console.log(`   ✅ Found ${profiles.length} profiles`);
      profiles.forEach((profile, index) => {
        console.log(`     ${index + 1}. ${profile.display_name || 'Unknown'}`);
        console.log(`        User ID: ${profile.user_id}`);
        console.log(`        Merchant: ${profile.is_merchant ? 'ON' : 'OFF'}`);
        console.log(`        Type: ${profile.user_type}`);
        console.log(`        Created: ${new Date(profile.created_at).toLocaleString()}`);
        console.log('');
      });
    }

    // Step 2: Check merchant_settings table
    console.log('2. Checking merchant_settings table...');
    
    const { data: merchantSettings, error: settingsError } = await supabase
      .from('merchant_settings')
      .select('*')
      .order('created_at', { ascending: false });

    if (settingsError) {
      console.log('   ❌ Error accessing merchant_settings:', settingsError.message);
    } else {
      console.log(`   ✅ Found ${merchantSettings.length} merchant settings`);
      merchantSettings.forEach((setting, index) => {
        console.log(`     ${index + 1}. User: ${setting.user_id.slice(0, 8)}...`);
        console.log(`        Online: ${setting.is_online}`);
        console.log(`        Accepts Trades: ${setting.accepts_new_trades}`);
        console.log(`        BTC Buy Rate: ₦${setting.btc_buy_rate?.toLocaleString() || 'Not set'}`);
        console.log(`        BTC Sell Rate: ₦${setting.btc_sell_rate?.toLocaleString() || 'Not set'}`);
        console.log('');
      });
    }

    // Step 3: Test merchant discovery query
    console.log('3. Testing merchant discovery query...');
    
    const { data: merchants, error: merchantError } = await supabase
      .from('profiles')
      .select(`
        user_id,
        display_name,
        is_merchant,
        user_type,
        created_at
      `)
      .eq('is_merchant', true)
      .in('user_type', ['merchant', 'premium']);

    if (merchantError) {
      console.log('   ❌ Merchant discovery query failed:', merchantError.message);
    } else {
      console.log(`   ✅ Merchant discovery found ${merchants.length} merchants`);
      merchants.forEach((merchant, index) => {
        console.log(`     ${index + 1}. ${merchant.display_name || 'Unknown'} (${merchant.user_id.slice(0, 8)}...)`);
      });
    }

    // Step 4: Test what each user would see
    if (profiles && profiles.length > 0) {
      console.log('\n4. Testing what each user would see...');
      
      for (const profile of profiles) {
        console.log(`\n   👤 ${profile.display_name || 'Unknown'} would see:`);
        
        const { data: visibleMerchants, error: visibleError } = await supabase
          .from('profiles')
          .select(`
            user_id,
            display_name,
            is_merchant,
            user_type
          `)
          .eq('is_merchant', true)
          .in('user_type', ['merchant', 'premium'])
          .neq('user_id', profile.user_id);

        if (visibleError) {
          console.log(`     ❌ Error: ${visibleError.message}`);
        } else {
          if (visibleMerchants.length === 0) {
            console.log('     📭 No merchants visible');
          } else {
            console.log(`     📋 ${visibleMerchants.length} merchants:`);
            visibleMerchants.forEach(merchant => {
              console.log(`       - ${merchant.display_name || 'Unknown'}`);
            });
          }
        }
      }
    }

    // Step 5: Recommendations
    console.log('\n🎯 Debug Summary:');
    
    if (!profiles || profiles.length === 0) {
      console.log('   ❌ No profiles found - users need to sign up first');
      console.log('   💡 Have User A and User B sign up through the app');
    } else if (profiles.length === 1) {
      console.log('   ⚠️  Only 1 user found - need at least 2 for testing');
      console.log('   💡 Create a second user account');
    } else {
      const merchantUsers = profiles.filter(p => p.is_merchant);
      const customerUsers = profiles.filter(p => !p.is_merchant);
      
      console.log(`   ✅ Found ${profiles.length} users (${merchantUsers.length} merchants, ${customerUsers.length} customers)`);
      
      if (merchantUsers.length === 0) {
        console.log('   ⚠️  No merchants found - toggle merchant mode ON for at least one user');
      }
      
      if (customerUsers.length === 0) {
        console.log('   ⚠️  No customers found - keep merchant mode OFF for at least one user');
      }
    }

    console.log('\n🚀 Next Steps:');
    console.log('   1. Ensure both users have signed up (check profiles table)');
    console.log('   2. User A: Toggle merchant mode ON and save settings');
    console.log('   3. User B: Keep merchant mode OFF');
    console.log('   4. User B: Check merchant list - should see User A');
    console.log('   5. If still not working, check browser console for errors');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugCurrentUsers().then(() => {
  console.log('\n✨ Debug completed!');
}).catch(error => {
  console.error('Debug failed:', error);
});
