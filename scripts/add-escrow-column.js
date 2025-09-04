#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://towffqxmmqyhbuyphkui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvd2ZmcXhtbXF5aGJ1eXBoa3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjkxMjYsImV4cCI6MjA2NzY0NTEyNn0.TOQhFmpUWX-LGf9YQl2TJEDIOT0dLG6xYslLaCcZhmY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addEscrowColumn() {
  console.log('🔧 Adding escrow_status column to trades table...\n');

  try {
    // Check if trades table exists and what columns it has
    console.log('1. Checking trades table structure...');
    
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .limit(1);

    if (tradesError) {
      console.log('   ❌ Error accessing trades table:', tradesError.message);
      return;
    }

    console.log('   ✅ Trades table accessible');

    // Check if escrow_status column exists
    if (trades.length > 0) {
      const sampleTrade = trades[0];
      if ('escrow_status' in sampleTrade) {
        console.log('   ✅ escrow_status column already exists');
      } else {
        console.log('   ⚠️  escrow_status column missing');
      }
    }

    console.log('\n📋 Manual SQL to run in Supabase Dashboard:');
    console.log('   Go to Supabase Dashboard → SQL Editor → Run this SQL:');
    console.log('');
    console.log('   -- Add escrow_status column to trades table');
    console.log('   ALTER TABLE trades ADD COLUMN IF NOT EXISTS escrow_status TEXT DEFAULT \'pending\'');
    console.log('   CHECK (escrow_status IN (\'pending\', \'crypto_received\', \'cash_received\', \'completed\', \'disputed\'));');
    console.log('');
    console.log('   -- Create index for better performance');
    console.log('   CREATE INDEX IF NOT EXISTS idx_trades_escrow_status ON trades(escrow_status);');
    console.log('');
    console.log('   -- Create escrow_transactions table');
    console.log('   -- (Copy content from scripts/create-escrow-table.sql)');

    console.log('\n🎯 After running the SQL:');
    console.log('   1. Test merchant discovery fix');
    console.log('   2. Test escrow system integration');
    console.log('   3. Verify trade flow with proper crypto escrow');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the script
addEscrowColumn().then(() => {
  console.log('\n✨ Escrow column setup completed!');
}).catch(error => {
  console.error('Setup failed:', error);
});
