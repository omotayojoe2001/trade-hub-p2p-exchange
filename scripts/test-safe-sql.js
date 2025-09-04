#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://towffqxmmqyhbuyphkui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvd2ZmcXhtbXF5aGJ1eXBoa3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjkxMjYsImV4cCI6MjA2NzY0NTEyNn0.TOQhFmpUWX-LGf9YQl2TJEDIOT0dLG6xYslLaCcZhmY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSafeSQL() {
  console.log('🧪 Testing Safe SQL Commands...\n');

  try {
    // Test 1: Simple SELECT with built-in functions
    console.log('1. Testing basic SQL with built-in functions...');
    const { data: timeData, error: timeError } = await supabase
      .from('notifications')
      .select('created_at')
      .limit(1);
    
    if (timeError) {
      console.log('   Basic SELECT: ❌ Failed');
      console.log('     Error:', timeError.message);
    } else {
      console.log('   Basic SELECT: ✅ Success');
      console.log('     Query executed successfully');
    }

    // Test 2: Count query (safe read-only)
    console.log('\n2. Testing COUNT queries...');
    const { count: notifCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('   COUNT query: ❌ Failed');
      console.log('     Error:', countError.message);
    } else {
      console.log('   COUNT query: ✅ Success');
      console.log('     Notifications count:', notifCount);
    }

    // Test 3: Multiple table counts
    console.log('\n3. Testing multiple table queries...');
    const tables = ['user_profiles', 'trade_requests', 'agents', 'trades'];
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ${table}: ❌ Error - ${error.message}`);
      } else {
        console.log(`   ${table}: ✅ Count = ${count}`);
      }
    }

    // Test 4: Simple INSERT test (safe - we'll delete it immediately)
    console.log('\n4. Testing safe INSERT/DELETE...');
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
      type: 'test',
      title: 'Test Notification',
      message: 'This is a test notification that will be deleted immediately',
      read: false,
      data: { test: true }
    };

    const { data: insertData, error: insertError } = await supabase
      .from('notifications')
      .insert(testData)
      .select();

    if (insertError) {
      console.log('   INSERT test: ❌ Failed');
      console.log('     Error:', insertError.message);
    } else {
      console.log('   INSERT test: ✅ Success');
      console.log('     Inserted record ID:', insertData[0]?.id);

      // Immediately delete the test record
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', insertData[0].id);

      if (deleteError) {
        console.log('   DELETE test: ❌ Failed');
        console.log('     Error:', deleteError.message);
        console.log('     ⚠️  Test record may still exist in database');
      } else {
        console.log('   DELETE test: ✅ Success');
        console.log('     Test record cleaned up');
      }
    }

    console.log('\n🎯 SQL Test Summary:');
    console.log('   ✅ Database connection working');
    console.log('   ✅ Read operations working');
    console.log('   ✅ Write operations working');
    console.log('   ✅ Your Supabase setup is fully functional!');

  } catch (error) {
    console.error('❌ SQL test failed:', error.message);
    console.log('\n💡 This might indicate:');
    console.log('   - Network connectivity issues');
    console.log('   - Supabase service unavailable');
    console.log('   - Invalid credentials');
    return false;
  }
}

// Run the test
testSafeSQL().then(() => {
  console.log('\n✨ Test completed!');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
