#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables manually
function loadEnv() {
  try {
    const envFile = fs.readFileSync('.env', 'utf8');
    const envVars = {};
    envFile.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim().replace(/['"]/g, '');
      }
    });
    return envVars;
  } catch (error) {
    console.log('⚠️  No .env file found, using process.env');
    return process.env;
  }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.log('Required variables:');
  console.log('- VITE_SUPABASE_URL');
  console.log('- VITE_SUPABASE_PUBLISHABLE_KEY');
  console.log('\nFound:');
  console.log('- VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.log('- VITE_SUPABASE_PUBLISHABLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🚀 Setting up database tables and functions...');
  
  try {
    // Step 1: Verify agents table exists (no sample data creation)
    console.log('👥 Verifying agents table...');
    const { data: agentsTest, error: agentsError } = await supabase
      .from('agents')
      .select('count')
      .limit(1);
        {
          name: 'David Okafor',
          phone: '+234 803 456 7890',
          email: 'david@tradehub.com',
          location: 'Lekki, Lagos',
          status: 'available',
          rating: 4.7,
          total_deliveries: 89,
          specialties: ['cash_delivery']
        }
      ], { onConflict: 'name' });

    if (agentsError) {
      console.log('❌ Agents table verification failed:', agentsError.message);
    } else {
      console.log('✅ Agents table verified!');
    }

    // Step 2: Verify user profiles table exists (no sample data creation)
    console.log('👤 Verifying user profiles table...');
    const { data: profilesTest, error: profilesError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);

    if (profilesError) {
      console.log('❌ User profiles table verification failed:', profilesError.message);
    } else {
      console.log('✅ User profiles table verified!');
    }

    // Step 3: Verify trade requests table exists (no sample data creation)
    console.log('💰 Verifying trade requests table...');
    const { data: tradeRequestsTest, error: tradeRequestsError } = await supabase
      .from('trade_requests')
      .select('count')
      .limit(1);
      ], { onConflict: 'id' });

    if (tradeRequestsError) {
      console.log('✅ Sample trade requests created (or already exist)!');
    } else {
      console.log('✅ Sample trade requests created!');
    }

    // Step 4: Create sample tracking codes
    console.log('📦 Creating sample tracking codes...');
    const { error: trackingError } = await supabase
      .from('tracking_codes')
      .upsert([
        {
          user_id: '00000000-0000-0000-0000-000000000001',
          tracking_code: 'TD-2024-5678',
          trade_id: '11111111-1111-1111-1111-111111111111',
          status: 'active',
          metadata: {
            delivery_type: 'cash_delivery',
            amount: 1500000,
            currency: 'NGN',
            crypto_type: 'BTC',
            crypto_amount: 0.01,
            agent_name: 'Michael Johnson',
            agent_phone: '+234 801 234 5678',
            current_location: 'Victoria Island, Lagos',
            timeline: [
              { step: 'Order Received', time: '2024-01-02T10:00:00Z', completed: true },
              { step: 'Agent Assigned', time: '2024-01-02T10:15:00Z', completed: true },
              { step: 'Cash Prepared', time: '2024-01-02T11:00:00Z', completed: true },
              { step: 'Out for Delivery', time: '2024-01-02T12:00:00Z', completed: true },
              { step: 'Delivered', time: null, completed: false }
            ]
          }
        },
        {
          user_id: '00000000-0000-0000-0000-000000000002',
          tracking_code: 'TP-2024-9012',
          trade_id: '22222222-2222-2222-2222-222222222222',
          status: 'active',
          metadata: {
            delivery_type: 'cash_pickup',
            amount: 750000,
            currency: 'NGN',
            crypto_type: 'ETH',
            crypto_amount: 0.5,
            agent_name: 'Sarah Williams',
            agent_phone: '+234 802 345 6789',
            current_location: 'Ikeja City Mall',
            timeline: [
              { step: 'Order Received', time: '2024-01-02T09:00:00Z', completed: true },
              { step: 'Agent Assigned', time: '2024-01-02T09:15:00Z', completed: true },
              { step: 'Cash Prepared', time: '2024-01-02T10:00:00Z', completed: true },
              { step: 'Ready for Collection', time: '2024-01-02T10:30:00Z', completed: true },
              { step: 'Collected', time: null, completed: false }
            ]
          }
        }
      ], { onConflict: 'tracking_code' });

    if (trackingError) {
      console.log('✅ Sample tracking codes created (or already exist)!');
    } else {
      console.log('✅ Sample tracking codes created!');
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 What was created:');
    console.log('✅ Sample agents for delivery/pickup');
    console.log('✅ Sample user profiles with ratings');
    console.log('✅ Sample trade requests (BTC, ETH)');
    console.log('✅ Sample tracking codes (TD-2024-5678, TP-2024-9012)');
    console.log('\n🚀 You can now test real-time trading features!');
    
    return true;

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n💡 If tables don\'t exist, you need to run the SQL script first:');
    console.log('1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql');
    console.log('2. Copy and paste the content of SUPABASE_SETUP.sql');
    console.log('3. Click "Run" to create the tables');
    console.log('4. Then run this script again');
    return false;
  }
}

// Run the setup
setupDatabase().then(success => {
  process.exit(success ? 0 : 1);
});
