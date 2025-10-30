// Test BitGo webhook functionality
const WEBHOOK_URL = 'https://towffqxmmqyhbuyphkui.supabase.co/functions/v1/bitgo-webhook';

// Test BTC payment webhook
const testBTCPayment = {
  type: 'transfer',
  coin: 'btc',
  wallet: 'test-wallet-id',
  transfer: {
    txid: 'test-btc-txid-123',
    state: 'confirmed',
    value: 50000000, // 0.5 BTC in satoshis
    outputs: [
      {
        address: 'bc1qtest123address',
        value: 50000000
      }
    ]
  }
};

// Test USDT payment webhook
const testUSDTPayment = {
  type: 'transfer',
  coin: 'usdt',
  wallet: 'test-wallet-id',
  transfer: {
    txid: 'test-usdt-txid-456',
    state: 'confirmed',
    value: 1000000000, // 1000 USDT
    entries: [
      {
        address: 'usdt-test-address-789',
        value: 1000000000
      }
    ]
  }
};

async function testWebhook(payload, description) {
  console.log(`\n=== Testing ${description} ===`);
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log('Response:', result);
    console.log('Status:', response.status);
    
    if (response.ok) {
      console.log('✅ Webhook processed successfully');
    } else {
      console.log('❌ Webhook failed');
    }
  } catch (error) {
    console.error('❌ Error testing webhook:', error);
  }
}

async function runTests() {
  console.log('🚀 Testing BitGo Webhook Handler');
  
  // Test BTC payment
  await testWebhook(testBTCPayment, 'BTC Payment');
  
  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test USDT payment
  await testWebhook(testUSDTPayment, 'USDT Payment');
  
  console.log('\n✅ All webhook tests completed');
}

// Run the tests
runTests().catch(console.error);