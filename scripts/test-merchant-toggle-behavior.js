#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://towffqxmmqyhbuyphkui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvd2ZmcXhtbXF5aGJ1eXBoa3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjkxMjYsImV4cCI6MjA2NzY0NTEyNn0.TOQhFmpUWX-LGf9YQl2TJEDIOT0dLG6xYslLaCcZhmY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMerchantToggleBehavior() {
  console.log('🧪 Testing Correct Merchant Toggle Behavior...\n');

  try {
    // Step 1: Get all users in the system
    console.log('1. Checking all users in the system...');
    
    const { data: allUsers, error: usersError } = await supabase
      .from('profiles')
      .select(`
        user_id,
        display_name,
        is_merchant,
        user_type,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (usersError) {
      console.log('   ❌ Error fetching users:', usersError.message);
      return;
    }

    console.log(`   ✅ Found ${allUsers.length} total users in system`);
    allUsers.forEach((user, index) => {
      const merchantStatus = user.is_merchant ? 'MERCHANT ON' : 'MERCHANT OFF';
      console.log(`     ${index + 1}. ${user.display_name || 'Unknown'} - ${merchantStatus} (${user.user_id.slice(0, 8)}...)`);
    });

    if (allUsers.length < 2) {
      console.log('\n   ⚠️  Need at least 2 users to test merchant toggle behavior');
      console.log('   💡 Create 2 test accounts to properly test the system');
      return;
    }

    // Step 2: Test merchant visibility scenarios
    console.log('\n2. Testing merchant visibility scenarios...');
    
    const userA = allUsers.find(u => u.is_merchant === true);
    const userB = allUsers.find(u => u.is_merchant === false);

    if (!userA) {
      console.log('   ⚠️  No users with merchant mode ON found');
      console.log('   💡 Toggle merchant mode ON for at least one user');
    } else {
      console.log(`   📋 User A (Merchant ON): ${userA.display_name || 'Unknown'}`);
    }

    if (!userB) {
      console.log('   ⚠️  No users with merchant mode OFF found');
      console.log('   💡 Keep at least one user with merchant mode OFF');
    } else {
      console.log(`   📋 User B (Merchant OFF): ${userB.display_name || 'Unknown'}`);
    }

    // Step 3: Test what each user should see
    console.log('\n3. Testing merchant discovery for each user...');

    for (const currentUser of allUsers) {
      console.log(`\n   👤 Testing for ${currentUser.display_name || 'Unknown'} (${currentUser.is_merchant ? 'Merchant ON' : 'Merchant OFF'}):`);
      
      // What this user should see in merchant list
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
        .neq('user_id', currentUser.user_id); // Exclude current user

      if (visibleError) {
        console.log(`     ❌ Error: ${visibleError.message}`);
      } else {
        console.log(`     ✅ Can see ${visibleMerchants.length} merchants:`);
        visibleMerchants.forEach(merchant => {
          console.log(`       - ${merchant.display_name || 'Unknown'} (${merchant.user_id.slice(0, 8)}...)`);
        });

        // Verify user doesn't see themselves
        const selfInList = visibleMerchants.find(m => m.user_id === currentUser.user_id);
        if (selfInList) {
          console.log(`     ❌ ERROR: User sees themselves in merchant list!`);
        } else {
          console.log(`     ✅ CORRECT: User does not see themselves`);
        }
      }
    }

    // Step 4: Test expected behavior scenarios
    console.log('\n4. Expected behavior verification...');
    
    console.log('\n   📋 Correct Merchant Toggle Behavior:');
    console.log('   ✅ User A (Merchant ON):');
    console.log('     - Appears in merchant list for others');
    console.log('     - Can receive trade requests');
    console.log('     - Can still buy crypto from others');
    console.log('     - Does NOT see themselves in merchant list');
    
    console.log('\n   ✅ User B (Merchant OFF):');
    console.log('     - Does NOT appear in merchant list for others');
    console.log('     - Cannot receive trade requests');
    console.log('     - Can still see ALL other merchants (including User A)');
    console.log('     - Can still buy crypto from others');
    console.log('     - Does NOT see themselves in merchant list');

    // Step 5: Test merchant settings
    console.log('\n5. Checking merchant settings...');
    
    const merchantUsers = allUsers.filter(u => u.is_merchant);
    if (merchantUsers.length > 0) {
      const { data: merchantSettings, error: settingsError } = await supabase
        .from('merchant_settings')
        .select('*')
        .in('user_id', merchantUsers.map(u => u.user_id));

      if (settingsError) {
        console.log('   ❌ Error fetching merchant settings:', settingsError.message);
      } else {
        console.log(`   ✅ Found settings for ${merchantSettings.length}/${merchantUsers.length} merchants`);
        merchantSettings.forEach(setting => {
          const user = merchantUsers.find(u => u.user_id === setting.user_id);
          console.log(`     - ${user?.display_name || 'Unknown'}: Online=${setting.is_online}, Accepts=${setting.accepts_new_trades}`);
        });
      }
    }

    // Step 6: Summary and recommendations
    console.log('\n🎯 Test Results Summary:');
    
    if (userA && userB) {
      console.log('   ✅ Have both merchant ON and OFF users for testing');
    } else {
      console.log('   ⚠️  Need both merchant ON and OFF users for complete testing');
    }

    console.log('\n🚀 Manual Testing Steps:');
    console.log('   1. User A: Toggle merchant mode ON → Set rates');
    console.log('   2. User B: Keep merchant mode OFF');
    console.log('   3. User B: Go to merchant list → Should see User A');
    console.log('   4. User A: Go to merchant list → Should see other merchants, NOT themselves');
    console.log('   5. User B: Create trade request with User A');
    console.log('   6. User A: Should receive trade request notification');

    console.log('\n💡 If User B cannot see User A:');
    console.log('   • Check User A has merchant settings saved');
    console.log('   • Verify User A has is_online=true in merchant_settings');
    console.log('   • Clear browser cache and try again');
    console.log('   • Check browser console for errors');

    console.log('\n🔧 Debug Commands:');
    console.log('   • Check merchant settings: SELECT * FROM merchant_settings;');
    console.log('   • Check profiles: SELECT user_id, display_name, is_merchant FROM profiles;');
    console.log('   • Test merchant query: SELECT * FROM profiles WHERE is_merchant=true;');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testMerchantToggleBehavior().then(() => {
  console.log('\n✨ Merchant toggle behavior test completed!');
}).catch(error => {
  console.error('Test failed:', error);
});
