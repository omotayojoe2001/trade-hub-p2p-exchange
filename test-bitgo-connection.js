// Test BitGo connection and wallet access
const BITGO_ESCROW_URL = 'https://towffqxmmqyhbuyphkui.supabase.co/functions/v1/bitgo-escrow';

async function testBitGoConnection() {
  console.log('🔍 Testing BitGo Connection...\n');
  
  // Test BTC address generation
  console.log('1. Testing BTC address generation...');
  try {
    const btcResponse = await fetch(BITGO_ESCROW_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tradeId: 'test-btc-' + Date.now(),
        coin: 'BTC',
        expectedAmount: 0.001
      })
    });
    
    const btcResult = await btcResponse.json();
    console.log('BTC Result:', btcResult);
    
    if (btcResult.address) {
      console.log('✅ BTC address generated:', btcResult.address);
      if (btcResult.isReal) {
        console.log('✅ Real BitGo BTC address!');
      } else {
        console.log('⚠️ Fallback BTC address (BitGo API issue)');
      }
    } else {
      console.log('❌ BTC failed:', btcResult.error);
    }
  } catch (error) {
    console.log('❌ BTC error:', error.message);
  }
  
  console.log('\\n2. Testing USDT address generation...');
  try {
    const usdtResponse = await fetch(BITGO_ESCROW_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tradeId: 'test-usdt-' + Date.now(),
        coin: 'USDT',
        expectedAmount: 100
      })
    });
    
    const usdtResult = await usdtResponse.json();
    console.log('USDT Result:', usdtResult);
    
    if (usdtResult.address) {
      console.log('✅ USDT address generated:', usdtResult.address);
      if (usdtResult.isReal) {
        console.log('✅ Real BitGo USDT address!');
      } else {
        console.log('⚠️ Fallback USDT address (BitGo API issue)');
      }
    } else {
      console.log('❌ USDT failed:', usdtResult.error);
    }
  } catch (error) {
    console.log('❌ USDT error:', error.message);
  }
  
  console.log('\\n📋 Summary:');
  console.log('- If you see "Real BitGo address" - everything is working perfectly!');
  console.log('- If you see "Fallback address" - check your BitGo API credentials');
  console.log('- Fallback addresses still work for testing, but won\'t receive real payments');
}

testBitGoConnection().catch(console.error);