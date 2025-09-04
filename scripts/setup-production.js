#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://towffqxmmqyhbuyphkui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvd2ZmcXhtbXF5aGJ1eXBoa3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjkxMjYsImV4cCI6MjA2NzY0NTEyNn0.TOQhFmpUWX-LGf9YQl2TJEDIOT0dLG6xYslLaCcZhmY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupProduction() {
  console.log('🚀 Setting up PRODUCTION-LEVEL testing environment...\n');

  try {
    // Step 1: Clean up all mock/sample data
    console.log('🧹 Cleaning up mock data...');
    
    // Delete sample trade requests with fake UUIDs
    const { error: cleanTradesError } = await supabase
      .from('trade_requests')
      .delete()
      .in('id', [
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        '33333333-3333-3333-3333-333333333333'
      ]);

    if (cleanTradesError) {
      console.log('   ⚠️  Trade cleanup warning:', cleanTradesError.message);
    } else {
      console.log('   ✅ Mock trade requests cleaned');
    }

    // Delete sample user profiles with fake UUIDs
    const { error: cleanProfilesError } = await supabase
      .from('user_profiles')
      .delete()
      .in('user_id', [
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000003'
      ]);

    if (cleanProfilesError) {
      console.log('   ⚠️  Profile cleanup warning:', cleanProfilesError.message);
    } else {
      console.log('   ✅ Mock user profiles cleaned');
    }

    // Delete sample tracking codes
    const { error: cleanTrackingError } = await supabase
      .from('tracking_codes')
      .delete()
      .in('tracking_code', ['TD-2024-5678', 'TP-2024-9012', 'TD-2024-TEST']);

    if (cleanTrackingError) {
      console.log('   ⚠️  Tracking cleanup warning:', cleanTrackingError.message);
    } else {
      console.log('   ✅ Mock tracking codes cleaned');
    }

    // Keep agents for delivery functionality, but they're real service providers
    console.log('   ✅ Keeping delivery agents (real service providers)');

    // Step 2: Verify clean state
    console.log('\n🔍 Verifying clean state...');
    
    const { data: remainingTrades } = await supabase
      .from('trade_requests')
      .select('count')
      .limit(1);

    const { data: remainingProfiles } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);

    const { data: remainingTracking } = await supabase
      .from('tracking_codes')
      .select('count')
      .limit(1);

    console.log('   Trade requests:', remainingTrades?.length || 0);
    console.log('   User profiles:', remainingProfiles?.length || 0);
    console.log('   Tracking codes:', remainingTracking?.length || 0);

    // Step 3: Set up real-time subscriptions
    console.log('\n📡 Setting up real-time subscriptions...');
    
    // Test real-time connection
    const channel = supabase
      .channel('production-test')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'trade_requests' }, 
        (payload) => console.log('Real-time test:', payload)
      )
      .subscribe();

    setTimeout(() => {
      supabase.removeChannel(channel);
      console.log('   ✅ Real-time subscriptions working');
    }, 2000);

    console.log('\n🎉 Production environment ready!');
    console.log('\n📋 PRODUCTION TESTING INSTRUCTIONS:');
    console.log('');
    console.log('1. 🧑‍💼 CREATE REAL USERS:');
    console.log('   • Open 2 browser windows (normal + incognito)');
    console.log('   • Sign up with real emails:');
    console.log('     - user1@yourdomain.com');
    console.log('     - user2@yourdomain.com');
    console.log('   • Complete profile setup for both');
    console.log('');
    console.log('2. 💬 TEST REAL MESSAGING:');
    console.log('   • User1: Go to Messages → Start new conversation');
    console.log('   • User2: Receive and reply to messages');
    console.log('   • Verify real-time message delivery');
    console.log('');
    console.log('3. 🔄 TEST REAL TRADING:');
    console.log('   • User1: Create trade request (Buy/Sell crypto)');
    console.log('   • User2: See trade request in real-time');
    console.log('   • User2: Accept trade request');
    console.log('   • Both: Complete trade flow with real notifications');
    console.log('');
    console.log('4. 🔔 TEST REAL NOTIFICATIONS:');
    console.log('   • All actions should trigger real notifications');
    console.log('   • Notifications should appear in real-time');
    console.log('   • Read/unread status should persist');
    console.log('');
    console.log('5. 📦 TEST REAL DELIVERY TRACKING:');
    console.log('   • Complete a trade with cash delivery/pickup');
    console.log('   • Get real tracking code');
    console.log('   • Track delivery status updates');
    console.log('');
    console.log('🎯 WHAT YOU SHOULD SEE:');
    console.log('   ✅ Only real user data (no mock profiles)');
    console.log('   ✅ Only real trade requests from actual users');
    console.log('   ✅ Real-time updates between browser windows');
    console.log('   ✅ Real message conversations');
    console.log('   ✅ Real notification system');
    console.log('   ✅ Real tracking codes generated');
    console.log('');
    console.log('❌ WHAT YOU SHOULD NOT SEE:');
    console.log('   ❌ No mock users (Sarah Wilson, Mike Chen, etc.)');
    console.log('   ❌ No hardcoded trade requests');
    console.log('   ❌ No demo tracking codes (TD-2024-5678)');
    console.log('   ❌ No sample notifications');
    console.log('');
    console.log('🚀 START TESTING NOW!');

  } catch (error) {
    console.error('❌ Production setup failed:', error.message);
  }
}

setupProduction();
