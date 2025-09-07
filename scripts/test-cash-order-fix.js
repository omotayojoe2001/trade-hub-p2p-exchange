import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

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
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCashOrderFunction() {
  console.log('🧪 Testing cash order function after fix...');
  
  try {
    // Test the generate_cash_order_tracking_code function
    console.log('1. Testing generate_cash_order_tracking_code function...');
    const { data: trackingCode, error: trackingError } = await supabase.rpc('generate_cash_order_tracking_code', { 
      order_type: 'naira_to_usd_pickup' 
    });
    
    if (trackingError) {
      console.error('❌ generate_cash_order_tracking_code failed:', trackingError);
      return false;
    }
    
    console.log('✅ generate_cash_order_tracking_code works! Generated:', trackingCode);
    
    // Test creating a cash order (this will fail if the function isn't fixed)
    console.log('2. Testing create_cash_order_with_vendor function...');
    
    // Get a test user ID
    const { data: users } = await supabase.auth.getUser();
    if (!users?.user?.id) {
      console.log('⚠️  No authenticated user found. Please log in first.');
      return false;
    }
    
    const testOrderData = {
      p_user_id: users.user.id,
      p_naira_amount: 1000,
      p_usd_amount: 0.62,
      p_service_fee: 50,
      p_order_type: 'naira_to_usd_pickup',
      p_delivery_details: { address: 'Test Address' },
      p_contact_details: { phone: '1234567890' }
    };
    
    const { data: orderId, error: orderError } = await supabase.rpc('create_cash_order_with_vendor', testOrderData);
    
    if (orderError) {
      console.error('❌ create_cash_order_with_vendor failed:', orderError);
      return false;
    }
    
    console.log('✅ create_cash_order_with_vendor works! Created order:', orderId);
    
    // Clean up test order
    await supabase.from('cash_order_tracking').delete().eq('id', orderId);
    console.log('🧹 Cleaned up test order');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test
testCashOrderFunction().then(success => {
  if (success) {
    console.log('\n🎉 All tests passed! The tracking_code ambiguity has been fixed.');
    console.log('Your Send Naira payment flow should now work correctly.');
  } else {
    console.log('\n❌ Tests failed. The fix may not have been applied yet.');
    console.log('Please run the SQL fix in your Supabase dashboard first.');
  }
  process.exit(success ? 0 : 1);
});
