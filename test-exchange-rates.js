// Test exchange rate APIs
const API_KEY = 'ffa285e967c048af93a0f34d';

async function testExchangeRates() {
  console.log('🔍 Testing Exchange Rate APIs...\n');
  
  // Test 1: Primary API
  console.log('1. Testing primary exchange rate API...');
  try {
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`);
    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Primary API working');
      console.log('NGN Rate:', data.rates?.NGN);
      console.log('Available currencies:', Object.keys(data.rates || {}).slice(0, 10));
    } else {
      console.log('❌ Primary API failed:', await response.text());
    }
  } catch (error) {
    console.log('❌ Primary API error:', error.message);
  }
  
  // Test 2: Alternative API
  console.log('\n2. Testing alternative exchange rate API...');
  try {
    const response = await fetch('https://api.fxratesapi.com/latest?base=USD&symbols=NGN');
    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Alternative API working');
      console.log('NGN Rate:', data.rates?.NGN);
    } else {
      console.log('❌ Alternative API failed:', await response.text());
    }
  } catch (error) {
    console.log('❌ Alternative API error:', error.message);
  }
  
  // Test 3: Crypto prices
  console.log('\n3. Testing crypto price API...');
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether&vs_currencies=usd');
    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Crypto API working');
      console.log('BTC Price:', data.bitcoin?.usd);
      console.log('USDT Price:', data.tether?.usd);
    } else {
      console.log('❌ Crypto API failed:', await response.text());
    }
  } catch (error) {
    console.log('❌ Crypto API error:', error.message);
  }
}

testExchangeRates();