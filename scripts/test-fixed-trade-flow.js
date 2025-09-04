#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://towffqxmmqyhbuyphkui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvd2ZmcXhtbXF5aGJ1eXBoa3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjkxMjYsImV4cCI6MjA2NzY0NTEyNn0.TOQhFmpUWX-LGf9YQl2TJEDIOT0dLG6xYslLaCcZhmY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFixedTradeFlow() {
  console.log('🧪 Testing Fixed Trade Request Flow...\n');

  try {
    // Step 1: Clean up any existing trade requests for testing
    console.log('1. Cleaning up existing trade requests...');
    
    const { error: deleteError } = await supabase
      .from('trade_requests')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except system records

    if (deleteError) {
      console.log('   ⚠️  Could not clean up:', deleteError.message);
    } else {
      console.log('   ✅ Cleaned up existing trade requests');
    }

    // Step 2: Check current users and merchants
    console.log('\n2. Checking current users and merchants...');
    
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
      const status = profile.is_merchant ? '🏪 MERCHANT' : '👤 CUSTOMER';
      console.log(`     ${index + 1}. ${profile.display_name} - ${status}`);
    });

    const merchants = profiles.filter(p => p.is_merchant);
    const customers = profiles.filter(p => !p.is_merchant);

    if (merchants.length === 0) {
      console.log('\n   ⚠️  No merchants found! Need at least one user with merchant mode ON');
      return;
    }

    if (customers.length === 0) {
      console.log('\n   ⚠️  No customers found! Need at least one user with merchant mode OFF');
      return;
    }

    // Step 3: Test the expected flow
    console.log('\n3. Testing expected trade request flow...');
    
    console.log('\n   📋 FIXED FLOW:');
    console.log('   1. Customer: Buy Crypto → Enter amount → Continue');
    console.log('   2. Customer: Merchant List → Select merchant (NO trade request yet)');
    console.log('   3. Customer: Payment Status → Shows REAL merchant name');
    console.log('   4. Customer: Enter amount → Click "Send Trade Request"');
    console.log('   5. Merchant: Gets ONE notification for specific amount');
    console.log('   6. Merchant: Accept/Reject → Customer gets response');

    // Step 4: Check for any remaining trade requests
    console.log('\n4. Checking for any trade requests...');
    
    const { data: tradeRequests, error: tradeError } = await supabase
      .from('trade_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (tradeError) {
      console.log('   ❌ Error fetching trade requests:', tradeError.message);
    } else {
      console.log(`   ✅ Found ${tradeRequests.length} trade requests`);
      
      if (tradeRequests.length > 0) {
        console.log('   📋 Current trade requests:');
        tradeRequests.forEach((request, index) => {
          const requester = profiles.find(p => p.user_id === request.user_id);
          console.log(`     ${index + 1}. ${requester?.display_name || 'Unknown'}: ${request.trade_type.toUpperCase()} ${request.amount} ${request.coin_type} for ₦${request.naira_amount.toLocaleString()} (${request.status})`);
        });
      }
    }

    // Step 5: Check notifications
    console.log('\n5. Checking notifications...');
    
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'trade_request')
      .order('created_at', { ascending: false })
      .limit(10);

    if (notifError) {
      console.log('   ❌ Error fetching notifications:', notifError.message);
    } else {
      console.log(`   ✅ Found ${notifications.length} trade request notifications`);
      
      if (notifications.length > 0) {
        console.log('   📋 Recent notifications:');
        notifications.forEach((notif, index) => {
          const recipient = profiles.find(p => p.user_id === notif.user_id);
          console.log(`     ${index + 1}. To ${recipient?.display_name || 'Unknown'}: ${notif.message}`);
        });
      }
    }

    // Step 6: Manual testing instructions
    console.log('\n🎯 Manual Testing Instructions:');
    
    console.log('\n   👤 Customer (User B) - FIXED FLOW:');
    console.log('   1. Go to Trade → Buy Crypto');
    console.log('   2. Enter amount (e.g., 0.1 BTC)');
    console.log('   3. Click Continue → Should go to Merchant List');
    console.log('   4. Select merchant → Should go to Payment Status');
    console.log('   5. Payment Status should show REAL merchant name (not MercyPay)');
    console.log('   6. Enter amount → Click "Send Trade Request"');
    console.log('   7. Should create ONE trade request with correct amount');

    console.log('\n   🏪 Merchant (User A) - EXPECTED RESPONSE:');
    console.log('   1. Should get ONE notification for specific amount');
    console.log('   2. Click "Requests" → Should see trade with correct details');
    console.log('   3. Accept trade → Should work without 403 errors');
    console.log('   4. Customer should get acceptance notification');

    // Step 7: Success criteria
    console.log('\n🎉 Success Criteria:');
    console.log('   ✅ Payment Status shows REAL merchant name (not MercyPay)');
    console.log('   ✅ Trade request created ONLY when user clicks "Send Trade Request"');
    console.log('   ✅ ONE trade request per user action (no duplicates)');
    console.log('   ✅ Correct amount from user input');
    console.log('   ✅ Merchant can accept without 403 errors');
    console.log('   ✅ Real-time notifications work');

    console.log('\n💡 If Issues Persist:');
    console.log('   • Run the RLS fix script: scripts/fix-trade-request-rls.sql');
    console.log('   • Clear browser cache completely');
    console.log('   • Check browser console for errors');
    console.log('   • Verify both users are authenticated');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFixedTradeFlow().then(() => {
  console.log('\n✨ Fixed trade flow test completed!');
}).catch(error => {
  console.error('Test failed:', error);
});
