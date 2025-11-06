// BitGo Debug Script - Run this to diagnose issues
const BITGO_ACCESS_TOKEN = 'v2x30dc7e715665b4e26e73b79dde5e8a8bccbc08d86402920474b8fd4186e69fbb';
const BTC_WALLET_ID = '68dd6fe94425f8b958244dcf157a6635';

async function debugBitGo() {
  console.log('🔍 Debugging BitGo Issues...\n');
  
  // 1. Test token validity
  console.log('1. Testing access token...');
  try {
    const response = await fetch('https://app.bitgo.com/api/v2/user/me', {
      headers: { 'Authorization': `Bearer ${BITGO_ACCESS_TOKEN}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Token valid - User:', data.user?.name || 'Unknown');
    } else {
      console.log('❌ Token invalid:', response.status, await response.text());
      return;
    }
  } catch (error) {
    console.log('❌ Token test failed:', error.message);
    return;
  }
  
  // 2. Test wallet access
  console.log('\n2. Testing BTC wallet access...');
  try {
    const response = await fetch(`https://app.bitgo.com/api/v2/btc/wallet/${BTC_WALLET_ID}`, {
      headers: { 'Authorization': `Bearer ${BITGO_ACCESS_TOKEN}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Wallet accessible - ID:', data.id?.slice(0, 8) + '...');
    } else {
      console.log('❌ Wallet access failed:', response.status, await response.text());
      return;
    }
  } catch (error) {
    console.log('❌ Wallet test failed:', error.message);
    return;
  }
  
  // 3. Test address generation
  console.log('\n3. Testing address generation...');
  try {
    const response = await fetch(`https://app.bitgo.com/api/v2/btc/wallet/${BTC_WALLET_ID}/address`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BITGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        label: `debug-test-${Date.now()}`,
        chain: 0
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Address generated:', data.address);
    } else {
      const errorText = await response.text();
      console.log('❌ Address generation failed:', response.status, errorText);
      
      // Parse common errors
      if (response.status === 401) {
        console.log('💡 Issue: Token expired or invalid permissions');
      } else if (response.status === 403) {
        console.log('💡 Issue: IP address not whitelisted in BitGo');
      } else if (response.status === 404) {
        console.log('💡 Issue: Wallet ID not found or incorrect');
      }
    }
  } catch (error) {
    console.log('❌ Address generation test failed:', error.message);
  }
  
  console.log('\n🔧 Common fixes:');
  console.log('- Check IP whitelist in BitGo token settings');
  console.log('- Verify token has "Wallet - Create" permissions');
  console.log('- Ensure wallet IDs are correct');
  console.log('- Check if token expired');
}

debugBitGo();