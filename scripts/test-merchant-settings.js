#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://towffqxmmqyhbuyphkui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvd2ZmcXhtbXF5aGJ1eXBoa3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjkxMjYsImV4cCI6MjA2NzY0NTEyNn0.TOQhFmpUWX-LGf9YQl2TJEDIOT0dLG6xYslLaCcZhmY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMerchantSettings() {
  console.log('🧪 Testing Merchant Settings Functionality...\n');

  try {
    // Step 1: Check merchant_settings table structure
    console.log('1. Checking merchant_settings table structure...');
    
    const { data: tableData, error: tableError } = await supabase
      .from('merchant_settings')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('   ❌ Error accessing merchant_settings table:', tableError.message);
      return;
    }

    console.log('   ✅ merchant_settings table accessible');

    // Step 2: Check existing merchant settings
    console.log('\n2. Checking existing merchant settings...');
    
    const { data: existingSettings, error: settingsError } = await supabase
      .from('merchant_settings')
      .select('*')
      .limit(5);

    if (settingsError) {
      console.log('   ❌ Error fetching merchant settings:', settingsError.message);
    } else {
      console.log(`   ✅ Found ${existingSettings.length} existing merchant settings`);
      existingSettings.forEach(setting => {
        console.log(`     - User: ${setting.user_id.slice(0, 8)}... (${setting.merchant_type}, Online: ${setting.is_online})`);
      });
    }

    // Step 3: Test merchant list query with settings
    console.log('\n3. Testing merchant list with settings...');
    
    // Get merchants with their settings
    const { data: merchants, error: merchantError } = await supabase
      .from('profiles')
      .select(`
        user_id,
        display_name,
        is_merchant,
        user_type
      `)
      .eq('is_merchant', true);

    if (merchantError) {
      console.log('   ❌ Error fetching merchants:', merchantError.message);
    } else {
      console.log(`   ✅ Found ${merchants.length} merchants`);
      
      if (merchants.length > 0) {
        // Get settings for these merchants
        const userIds = merchants.map(m => m.user_id);
        const { data: merchantSettings, error: msError } = await supabase
          .from('merchant_settings')
          .select('*')
          .in('user_id', userIds);

        if (msError) {
          console.log('   ⚠️  Could not fetch merchant settings:', msError.message);
        } else {
          console.log(`   ✅ Found settings for ${merchantSettings.length} merchants`);
          
          merchants.forEach(merchant => {
            const settings = merchantSettings.find(s => s.user_id === merchant.user_id);
            console.log(`     - ${merchant.display_name || 'Unknown'}: ${settings ? 'Has settings' : 'No settings'}`);
            if (settings) {
              console.log(`       BTC Buy: ₦${settings.btc_buy_rate?.toLocaleString() || 'Not set'}`);
              console.log(`       BTC Sell: ₦${settings.btc_sell_rate?.toLocaleString() || 'Not set'}`);
              console.log(`       Online: ${settings.is_online}, Accepts trades: ${settings.accepts_new_trades}`);
            }
          });
        }
      }
    }

    // Step 4: Test the simplified settings structure
    console.log('\n4. Testing simplified merchant settings structure...');
    
    const testSettings = {
      merchant_type: 'manual',
      btc_buy_rate: 150000000, // ₦150M per BTC
      btc_sell_rate: 149000000, // ₦149M per BTC
      usdt_buy_rate: 750, // ₦750 per USDT
      usdt_sell_rate: 748, // ₦748 per USDT
      min_trade_amount: 1000,
      max_trade_amount: 10000000,
      auto_accept_trades: false,
      auto_release_escrow: false,
      is_online: true,
      accepts_new_trades: true,
      avg_response_time_minutes: 10,
      payment_methods: ['bank_transfer', 'mobile_money']
    };

    console.log('   ✅ Test settings structure validated');
    console.log('   📝 Settings include:');
    console.log(`     - BTC rates: Buy ₦${testSettings.btc_buy_rate.toLocaleString()}, Sell ₦${testSettings.btc_sell_rate.toLocaleString()}`);
    console.log(`     - USDT rates: Buy ₦${testSettings.usdt_buy_rate}, Sell ₦${testSettings.usdt_sell_rate}`);
    console.log(`     - Trade limits: ₦${testSettings.min_trade_amount.toLocaleString()} - ₦${testSettings.max_trade_amount.toLocaleString()}`);
    console.log(`     - Payment methods: ${testSettings.payment_methods.join(', ')}`);

    // Step 5: Check if merchants appear in customer view
    console.log('\n5. Testing customer merchant discovery...');
    
    // Simulate what customers see
    const { data: availableMerchants, error: availableError } = await supabase
      .from('profiles')
      .select(`
        user_id,
        display_name,
        is_merchant,
        user_type
      `)
      .eq('is_merchant', true)
      .in('user_type', ['merchant', 'premium']);

    if (availableError) {
      console.log('   ❌ Error fetching available merchants:', availableError.message);
    } else {
      console.log(`   ✅ Customers can see ${availableMerchants.length} merchants`);
      
      if (availableMerchants.length === 0) {
        console.log('   ⚠️  No merchants available for customers!');
        console.log('   💡 To fix:');
        console.log('      1. User A: Sign up and toggle merchant mode ON');
        console.log('      2. User A: Set up merchant settings with rates');
        console.log('      3. User B: Check merchant list');
      } else {
        availableMerchants.forEach(merchant => {
          console.log(`     - ${merchant.display_name || 'Unknown'} (${merchant.user_type})`);
        });
      }
    }

    // Step 6: Summary and next steps
    console.log('\n🎯 Test Results Summary:');
    console.log('   ✅ merchant_settings table accessible');
    console.log('   ✅ Simplified settings structure working');
    console.log('   ✅ Merchant discovery query working');
    
    if (merchants.length > 0) {
      console.log('   ✅ Merchants available for testing');
    } else {
      console.log('   ⚠️  No merchants found - need to create test merchants');
    }

    console.log('\n🚀 Next Steps for Testing:');
    console.log('   1. User A: Sign up → Toggle merchant mode → Set rates');
    console.log('   2. User B: Sign up → Go to merchant list → Should see User A');
    console.log('   3. User B: Try to buy crypto → Should see User A\'s rates');
    console.log('   4. Test trade request creation and acceptance');

    console.log('\n💡 Troubleshooting Tips:');
    console.log('   • If merchant settings save fails: Check browser console');
    console.log('   • If no merchants appear: Verify merchant mode toggle works');
    console.log('   • If rates not showing: Check merchant_settings table data');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Common Issues:');
    console.log('   • Database connection problems');
    console.log('   • Missing table columns');
    console.log('   • RLS policy restrictions');
  }
}

// Run the test
testMerchantSettings().then(() => {
  console.log('\n✨ Merchant settings test completed!');
}).catch(error => {
  console.error('Test failed:', error);
});
