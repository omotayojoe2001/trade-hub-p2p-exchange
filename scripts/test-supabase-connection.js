#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://towffqxmmqyhbuyphkui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvd2ZmcXhtbXF5aGJ1eXBoa3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjkxMjYsImV4cCI6MjA2NzY0NTEyNn0.TOQhFmpUWX-LGf9YQl2TJEDIOT0dLG6xYslLaCcZhmY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  try {
    // Test 1: Check if we can connect
    console.log('1. Testing basic connection...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('   Auth status:', user ? 'Logged in' : 'Not logged in');
    if (authError) console.log('   Auth error:', authError.message);

    // Test 2: Check existing tables
    console.log('\n2. Checking existing tables...');

    // Check notifications table
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('count')
      .limit(1);
    console.log('   notifications table:', notifError ? '❌ Missing' : '✅ Exists');
    if (notifError) console.log('     Error:', notifError.message);

    // Test 3: Execute a safe SQL query
    console.log('\n3. Testing direct SQL execution...');
    const { data: sqlResult, error: sqlError } = await supabase
      .rpc('get_current_timestamp');

    if (sqlError) {
      console.log('   Direct SQL: ❌ Failed');
      console.log('     Error:', sqlError.message);

      // Try a simpler approach - just get table info
      const { data: tableInfo, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(5);

      if (tableError) {
        console.log('   Table query: ❌ Failed');
        console.log('     Error:', tableError.message);
      } else {
        console.log('   Table query: ✅ Success');
        console.log('     Found tables:', tableInfo?.map(t => t.table_name).join(', '));
      }
    } else {
      console.log('   Direct SQL: ✅ Success');
      console.log('     Current timestamp:', sqlResult);
    }

    // Check trade_requests table
    const { data: tradeRequests, error: tradeError } = await supabase
      .from('trade_requests')
      .select('count')
      .limit(1);
    console.log('   trade_requests table:', tradeError ? '❌ Missing' : '✅ Exists');
    if (tradeError) console.log('     Error:', tradeError.message);

    // Check user_profiles table
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    console.log('   user_profiles table:', profileError ? '❌ Missing' : '✅ Exists');
    if (profileError) console.log('     Error:', profileError.message);

    // Check tracking_codes table
    const { data: tracking, error: trackingError } = await supabase
      .from('tracking_codes')
      .select('count')
      .limit(1);
    console.log('   tracking_codes table:', trackingError ? '❌ Missing' : '✅ Exists');
    if (trackingError) console.log('     Error:', trackingError.message);

    // Check agents table
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('count')
      .limit(1);
    console.log('   agents table:', agentsError ? '❌ Missing' : '✅ Exists');
    if (agentsError) console.log('     Error:', agentsError.message);

    // Check trades table
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('count')
      .limit(1);
    console.log('   trades table:', tradesError ? '❌ Missing' : '✅ Exists');
    if (tradesError) console.log('     Error:', tradesError.message);

    // Check delivery_tracking table
    const { data: delivery, error: deliveryError } = await supabase
      .from('delivery_tracking')
      .select('count')
      .limit(1);
    console.log('   delivery_tracking table:', deliveryError ? '❌ Missing' : '✅ Exists');
    if (deliveryError) console.log('     Error:', deliveryError.message);

    // Test 3: Check actual data
    console.log('\n3. Checking actual data...');
    
    if (!notifError) {
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .limit(5);
      console.log('   notifications count:', notifData?.length || 0);
    }

    if (!tradeError) {
      const { data: tradeData } = await supabase
        .from('trade_requests')
        .select('*')
        .limit(5);
      console.log('   trade_requests count:', tradeData?.length || 0);
    }

    if (!profileError) {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(5);
      console.log('   user_profiles count:', profileData?.length || 0);
    }

    if (!trackingError) {
      const { data: trackingData } = await supabase
        .from('tracking_codes')
        .select('*')
        .limit(5);
      console.log('   tracking_codes count:', trackingData?.length || 0);
    }

    console.log('\n🎯 Summary:');
    console.log('   Connection:', '✅ Working');
    console.log('   Tables missing:', [
      notifError && 'notifications',
      tradeError && 'trade_requests', 
      profileError && 'user_profiles',
      trackingError && 'tracking_codes',
      agentsError && 'agents',
      tradesError && 'trades',
      deliveryError && 'delivery_tracking'
    ].filter(Boolean).join(', ') || 'None');

  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

testConnection();
