// Test script to verify vendor notification system
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testVendorNotification() {
  console.log('🧪 TESTING: Vendor notification system...');
  
  try {
    // 1. Get a vendor ID from the database
    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .select('id, user_id, display_name')
      .limit(1);
    
    if (vendorError || !vendors?.length) {
      console.error('❌ No vendors found:', vendorError);
      return;
    }
    
    const vendor = vendors[0];
    console.log('✅ Found vendor:', vendor);
    
    // 2. Create a test cash trade with vendor_paid status
    const testCashTrade = {
      trade_request_id: 'test-' + Date.now(),
      seller_id: 'test-seller-id',
      buyer_id: 'test-buyer-id',
      vendor_id: vendor.id,
      usd_amount: 500,
      delivery_type: 'delivery',
      delivery_address: '123 Test Street, Lagos',
      delivery_code: 'TEST123',
      seller_phone: '+234-800-000-0000',
      status: 'vendor_paid'
    };
    
    console.log('📝 Creating test cash trade:', testCashTrade);
    
    const { data: cashTrade, error: cashTradeError } = await supabase
      .from('cash_trades')
      .insert(testCashTrade)
      .select()
      .single();
    
    if (cashTradeError) {
      console.error('❌ Error creating cash trade:', cashTradeError);
      return;
    }
    
    console.log('✅ Cash trade created:', cashTrade);
    
    // 3. Send notification to vendor
    if (vendor.user_id) {
      const notification = {
        user_id: vendor.user_id,
        type: 'vendor_payment_received',
        title: '💰 TEST: Payment Received - Delivery Required!',
        message: `TEST NOTIFICATION: You received payment for $${testCashTrade.usd_amount} USD cash delivery. This is a test notification.`,
        data: {
          cash_trade_id: cashTrade.id,
          usd_amount: testCashTrade.usd_amount,
          delivery_code: testCashTrade.delivery_code,
          seller_phone: testCashTrade.seller_phone,
          delivery_type: testCashTrade.delivery_type,
          delivery_address: testCashTrade.delivery_address,
          vendor_id: vendor.id,
          priority: 'high',
          is_test: true
        }
      };
      
      console.log('📨 Sending notification to vendor:', notification);
      
      const { data: notificationResult, error: notificationError } = await supabase
        .from('notifications')
        .insert(notification);
      
      if (notificationError) {
        console.error('❌ Error sending notification:', notificationError);
      } else {
        console.log('✅ Notification sent successfully!');
      }
    }
    
    console.log('🎉 TEST COMPLETE: Check vendor dashboard for popup notification!');
    console.log('📱 Vendor should see:');
    console.log('  - Big popup with payment details');
    console.log('  - $500 USD delivery amount');
    console.log('  - Delivery code: TEST123');
    console.log('  - Customer phone: +234-800-000-0000');
    
    // Clean up test data after 30 seconds
    setTimeout(async () => {
      console.log('🧹 Cleaning up test data...');
      
      await supabase
        .from('cash_trades')
        .delete()
        .eq('id', cashTrade.id);
      
      if (vendor.user_id) {
        await supabase
          .from('notifications')
          .delete()
          .eq('user_id', vendor.user_id)
          .eq('data->is_test', true);
      }
      
      console.log('✅ Test data cleaned up');
    }, 30000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testVendorNotification();

module.exports = { testVendorNotification };