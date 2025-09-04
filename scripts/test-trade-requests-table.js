#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://towffqxmmqyhbuyphkui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvd2ZmcXhtbXF5aGJ1eXBoa3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjkxMjYsImV4cCI6MjA2NzY0NTEyNn0.TOQhFmpUWX-LGf9YQl2TJEDIOT0dLG6xYslLaCcZhmY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTradeRequestsTable() {
  console.log('🧪 Testing Trade Requests Table...\n');

  try {
    // Step 1: Test trade_requests table access
    console.log('1. Testing trade_requests table access...');
    
    const { data: tradeRequestsTest, error: tradeRequestsError } = await supabase
      .from('trade_requests')
      .select('count')
      .limit(1);

    if (tradeRequestsError) {
      console.log('   ❌ trade_requests table not accessible:', tradeRequestsError.message);
      console.log('   💡 Run: scripts/create-trade-requests-safe.sql in Supabase dashboard');
      return;
    } else {
      console.log('   ✅ trade_requests table accessible');
    }

    // Step 2: Test trades table access
    console.log('\n2. Testing trades table access...');
    
    const { data: tradesTest, error: tradesError } = await supabase
      .from('trades')
      .select('count')
      .limit(1);

    if (tradesError) {
      console.log('   ❌ trades table not accessible:', tradesError.message);
      console.log('   💡 This is OK if you haven\'t created trades table yet');
    } else {
      console.log('   ✅ trades table accessible');
    }

    // Step 3: Test profiles table access
    console.log('\n3. Testing profiles table access...');
    
    const { data: profilesTest, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (profilesError) {
      console.log('   ❌ profiles table not accessible:', profilesError.message);
    } else {
      console.log('   ✅ profiles table accessible');
    }

    // Step 4: Test notifications table access
    console.log('\n4. Testing notifications table access...');
    
    const { data: notificationsTest, error: notificationsError } = await supabase
      .from('notifications')
      .select('count')
      .limit(1);

    if (notificationsError) {
      console.log('   ❌ notifications table not accessible:', notificationsError.message);
    } else {
      console.log('   ✅ notifications table accessible');
    }

    // Step 5: Check existing data
    console.log('\n5. Checking existing data...');
    
    const { data: existingRequests, error: existingError } = await supabase
      .from('trade_requests')
      .select('*')
      .limit(5);

    if (existingError) {
      console.log('   ❌ Error fetching existing trade requests:', existingError.message);
    } else {
      console.log(`   ✅ Found ${existingRequests.length} existing trade requests`);
      existingRequests.forEach((request, index) => {
        console.log(`     ${index + 1}. ${request.trade_type.toUpperCase()} ${request.amount} ${request.coin_type} (${request.status})`);
      });
    }

    // Step 6: Test query that was failing
    console.log('\n6. Testing merchant trade requests query...');
    
    const { data: merchantRequests, error: merchantError } = await supabase
      .from('trade_requests')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (merchantError) {
      console.log('   ❌ Merchant query failed:', merchantError.message);
    } else {
      console.log(`   ✅ Merchant query successful - found ${merchantRequests.length} open requests`);
    }

    // Step 7: Summary
    console.log('\n🎯 Test Results Summary:');
    
    if (!tradeRequestsError) {
      console.log('   ✅ trade_requests table working');
    }
    
    if (!tradesError) {
      console.log('   ✅ trades table working');
    }
    
    if (!profilesError) {
      console.log('   ✅ profiles table working');
    }
    
    if (!notificationsError) {
      console.log('   ✅ notifications table working');
    }

    if (!merchantError) {
      console.log('   ✅ Merchant trade requests query working');
    }

    console.log('\n🚀 Next Steps:');
    console.log('   1. Test creating a trade request in the app');
    console.log('   2. Check if merchants receive notifications');
    console.log('   3. Test accept/reject functionality');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testTradeRequestsTable().then(() => {
  console.log('\n✨ Trade requests table test completed!');
}).catch(error => {
  console.error('Test failed:', error);
});
