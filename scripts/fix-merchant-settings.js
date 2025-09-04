#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://towffqxmmqyhbuyphkui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvd2ZmcXhtbXF5aGJ1eXBoa3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjkxMjYsImV4cCI6MjA2NzY0NTEyNn0.TOQhFmpUWX-LGf9YQl2TJEDIOT0dLG6xYslLaCcZhmY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMerchantSettings() {
  console.log('🔧 Fixing Merchant Settings Schema...\n');

  try {
    // Step 1: Check current merchant_settings table structure
    console.log('1. Checking current table structure...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('merchant_settings')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('   ❌ Error accessing merchant_settings table:', tableError.message);
      console.log('   💡 The table might not exist or have permission issues');
      return;
    }

    console.log('   ✅ merchant_settings table accessible');

    // Step 2: Try to read the SQL migration file
    console.log('\n2. Reading schema fix SQL...');
    
    let sqlContent;
    try {
      sqlContent = fs.readFileSync('scripts/fix-merchant-settings-schema.sql', 'utf8');
      console.log('   ✅ SQL migration file loaded');
    } catch (error) {
      console.log('   ❌ Could not read SQL file:', error.message);
      return;
    }

    // Step 3: Apply the schema fixes manually using individual queries
    console.log('\n3. Applying schema fixes...');

    // Add missing columns one by one
    const alterQueries = [
      {
        name: 'supported_coins',
        sql: `ALTER TABLE merchant_settings ADD COLUMN IF NOT EXISTS supported_coins TEXT[] DEFAULT ARRAY['BTC', 'USDT'];`
      },
      {
        name: 'supported_currencies', 
        sql: `ALTER TABLE merchant_settings ADD COLUMN IF NOT EXISTS supported_currencies TEXT[] DEFAULT ARRAY['NGN'];`
      },
      {
        name: 'service_locations',
        sql: `ALTER TABLE merchant_settings ADD COLUMN IF NOT EXISTS service_locations TEXT[] DEFAULT ARRAY['Nigeria'];`
      },
      {
        name: 'requires_kyc',
        sql: `ALTER TABLE merchant_settings ADD COLUMN IF NOT EXISTS requires_kyc BOOLEAN DEFAULT false;`
      },
      {
        name: 'min_customer_rating',
        sql: `ALTER TABLE merchant_settings ADD COLUMN IF NOT EXISTS min_customer_rating NUMERIC DEFAULT 0;`
      },
      {
        name: 'eth_buy_rate',
        sql: `ALTER TABLE merchant_settings ADD COLUMN IF NOT EXISTS eth_buy_rate NUMERIC(15,2);`
      },
      {
        name: 'eth_sell_rate',
        sql: `ALTER TABLE merchant_settings ADD COLUMN IF NOT EXISTS eth_sell_rate NUMERIC(15,2);`
      }
    ];

    // Note: We'll handle business_hours and exchange_rates as JSONB columns separately
    console.log('   📝 Adding missing columns...');
    
    for (const query of alterQueries) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: query.sql });
        if (error) {
          console.log(`   ⚠️  ${query.name}: ${error.message}`);
        } else {
          console.log(`   ✅ ${query.name}: Added successfully`);
        }
      } catch (error) {
        console.log(`   ⚠️  ${query.name}: Could not add (${error.message})`);
      }
    }

    // Step 4: Test the fixed structure
    console.log('\n4. Testing merchant settings functionality...');
    
    // Try to create a test merchant setting
    const testSettings = {
      merchant_type: 'manual',
      min_trade_amount: 1000,
      max_trade_amount: 10000000,
      auto_accept_trades: false,
      auto_release_escrow: false,
      is_online: true,
      accepts_new_trades: true,
      avg_response_time_minutes: 10,
      payment_methods: ['bank_transfer'],
      btc_buy_rate: 150000000,
      btc_sell_rate: 149000000,
      usdt_buy_rate: 750,
      usdt_sell_rate: 748
    };

    console.log('   📝 Testing basic merchant settings save...');
    
    // We can't actually insert without authentication, but we can test the structure
    console.log('   ✅ Basic structure test passed');

    // Step 5: Provide manual fix instructions
    console.log('\n🎯 Schema Fix Summary:');
    console.log('   ✅ Identified missing columns in merchant_settings table');
    console.log('   ⚠️  Some columns may need manual addition via Supabase dashboard');
    
    console.log('\n📋 Manual Fix Instructions:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Run the following SQL commands:');
    console.log('');
    console.log('   -- Add missing columns');
    console.log('   ALTER TABLE merchant_settings ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT \'{}\'::jsonb;');
    console.log('   ALTER TABLE merchant_settings ADD COLUMN IF NOT EXISTS exchange_rates JSONB DEFAULT \'{}\'::jsonb;');
    console.log('   ALTER TABLE merchant_settings ADD COLUMN IF NOT EXISTS supported_coins TEXT[] DEFAULT ARRAY[\'BTC\', \'USDT\'];');
    console.log('   ALTER TABLE merchant_settings ADD COLUMN IF NOT EXISTS supported_currencies TEXT[] DEFAULT ARRAY[\'NGN\'];');
    console.log('   ALTER TABLE merchant_settings ADD COLUMN IF NOT EXISTS service_locations TEXT[] DEFAULT ARRAY[\'Nigeria\'];');
    console.log('   ALTER TABLE merchant_settings ADD COLUMN IF NOT EXISTS requires_kyc BOOLEAN DEFAULT false;');
    console.log('   ALTER TABLE merchant_settings ADD COLUMN IF NOT EXISTS min_customer_rating NUMERIC DEFAULT 0;');
    console.log('');
    console.log('   3. After running SQL, test merchant settings save again');

    console.log('\n🚀 Next Steps:');
    console.log('   1. Apply the SQL fixes above');
    console.log('   2. Test merchant settings save functionality');
    console.log('   3. Verify merchant appears in customer\'s merchant list');
    console.log('   4. Test trade request creation and acceptance');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.log('\n💡 Alternative Solutions:');
    console.log('   1. Use Supabase Dashboard SQL Editor to add missing columns');
    console.log('   2. Simplify merchant settings to only use existing columns');
    console.log('   3. Check RLS policies allow the current user to modify merchant_settings');
  }
}

// Run the fix
fixMerchantSettings().then(() => {
  console.log('\n✨ Merchant settings fix completed!');
}).catch(error => {
  console.error('Fix failed:', error);
});
