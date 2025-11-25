import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, tradeId, coin, toAddress, amount } = await req.json();
    console.log(`🔄 BitGo Edge Function - ${action || 'generate'} for ${coin}`, { tradeId, coin, action });
    
    // Map coin types to BitGo wallet endpoints
    const walletMap = {
      'BTC': { coin: 'btc', wallet: '68dd6fe94425f8b958244dcf157a6635' },
      'USDT': { coin: 'sol', wallet: '68f23046ff389c3fefed72157e47503a' } // Solana USDT wallet
    };
    
    const walletInfo = walletMap[coin];
    if (!walletInfo) {
      console.error(`❌ Unsupported coin: ${coin}`);
      throw new Error(`Unsupported coin: ${coin}`);
    }
    
    console.log(`✅ Using wallet: ${walletInfo.coin}/${walletInfo.wallet}`);
    
    if (action === 'release') {
      // FUND RELEASE: Transfer crypto from escrow to recipient
      console.log(`🔄 Releasing ${coin} funds to ${toAddress}`);
      const response = await fetch(`http://13.53.167.64:3000/api/forward/api/v2/${walletInfo.coin}/wallet/${walletInfo.wallet}/sendcoins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer v2x9eba10d23cb16b271fd072394d76a4021ae88719dba92ab5a383f389715492d0'
        },
        body: JSON.stringify({
          address: toAddress,
          amount: coin === 'BTC' ? Math.round(amount * 100000000) : Math.round(amount * 1000000), // satoshis vs wei
          walletPassphrase: process.env.BITGO_WALLET_PASSPHRASE || 'your-wallet-passphrase'
        })
      });
      
      if (!response.ok) {
        console.error(`❌ BitGo release failed: ${response.status}`);
        throw new Error(`BitGo release failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ ${coin} release successful:`, data.txid);
      
      return new Response(JSON.stringify({ 
        txid: data.txid,
        status: 'released',
        isReal: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      // ADDRESS GENERATION: Create new escrow address
      console.log(`🔄 Generating ${coin} address via AWS proxy`);
      const response = await fetch(`http://13.53.167.64:3000/api/forward/api/v2/${walletInfo.coin}/wallet/${walletInfo.wallet}/address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer v2x9eba10d23cb16b271fd072394d76a4021ae88719dba92ab5a383f389715492d0'
        },
        body: JSON.stringify({
          label: `escrow-${coin}-${tradeId}-${Date.now()}`
        })
      });
      
      if (!response.ok) {
        console.error(`❌ AWS Proxy failed: ${response.status}`);
        const errorText = await response.text();
        console.error(`❌ Error details:`, errorText);
        throw new Error(`AWS Proxy failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`✅ ${coin} address generated:`, data.address);
      
      return new Response(JSON.stringify({ 
        address: data.address,
        isReal: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.error('❌ BitGo Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});