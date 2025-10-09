import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BITGO_BASE_URL = 'https://app.bitgo.com/api/v2';
const BITGO_ACCESS_TOKEN = Deno.env.get('BITGO_ACCESS_TOKEN') || 'v2x6dc774e0651de04e814d18bb30c36addaf7c75185670dacbf3679f49c25df8cf';
const BTC_WALLET_ID = Deno.env.get('BITGO_BTC_WALLET_ID') || '68dd6fe94425f8b958244dcf157a6635';
const ETH_WALLET_ID = Deno.env.get('BITGO_ETH_WALLET_ID') || '68dd72a44425f8b9582541296faadbda';
const XRP_WALLET_ID = Deno.env.get('BITGO_XRP_WALLET_ID') || '68dd73b355ce73d00a762c69c94941e9';
const POLYGON_WALLET_ID = Deno.env.get('BITGO_POLYGON_WALLET_ID') || '68dd731904bafab1d38eb9bb8061d12b';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const requestBody = await req.json();
    const { tradeId, coin, action, toAddress, amount, expectedAmount } = requestBody;
    
    console.log('BitGo request:', { tradeId, coin, action });
    console.log('Environment check:', {
      hasToken: !!BITGO_ACCESS_TOKEN,
      hasBtcWallet: !!BTC_WALLET_ID,
      hasEthWallet: !!ETH_WALLET_ID,
      tokenValue: BITGO_ACCESS_TOKEN?.slice(0, 10) + '...',
      btcWalletValue: BTC_WALLET_ID,
      ethWalletValue: ETH_WALLET_ID,
      baseUrl: BITGO_BASE_URL
    });
    
    // Test BitGo API connectivity first
    console.log('Testing BitGo API connectivity...');
    const testResponse = await fetch(`${BITGO_BASE_URL}/user/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BITGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('BitGo API test response:', {
      status: testResponse.status,
      statusText: testResponse.statusText,
      ok: testResponse.ok
    });
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('BitGo API test failed:', errorText);
      throw new Error(`BitGo API authentication failed: ${testResponse.status} - ${errorText}`);
    }
    
    if (action === 'release') {
      // Release funds from escrow
      const walletMap = { BTC: BTC_WALLET_ID, ETH: ETH_WALLET_ID, XRP: XRP_WALLET_ID, POLYGON: POLYGON_WALLET_ID };
      const coinTypeMap = { BTC: 'btc', ETH: 'eth', XRP: 'xrp', POLYGON: 'polygon' };
      const walletId = walletMap[coin];
      const coinType = coinTypeMap[coin];
      
      console.log('Releasing funds:', { walletId, coinType, toAddress, amount });
      
      const response = await fetch(`${BITGO_BASE_URL}/${coinType}/wallet/${walletId}/sendcoins`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${BITGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address: toAddress,
          amount: amount.toString()
        })
      });
      
      console.log('Release response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Release error:', errorText);
        throw new Error(`BitGo release error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Release successful:', data);
      
      // Update escrow status
      await supabase
        .from('escrow_addresses')
        .update({ 
          status: 'released',
          tx_hash: data.txid,
          released_at: new Date().toISOString()
        })
        .eq('trade_id', tradeId);
      
      return new Response(JSON.stringify({ txid: data.txid }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    

    

    
    // Test wallet access first
    const walletMap = { BTC: BTC_WALLET_ID, ETH: ETH_WALLET_ID, XRP: XRP_WALLET_ID, POLYGON: POLYGON_WALLET_ID };
    const coinTypeMap = { BTC: 'btc', ETH: 'eth', XRP: 'xrp', POLYGON: 'polygon' };
    const walletId = walletMap[coin];
    const coinType = coinTypeMap[coin];
    
    console.log('Testing wallet access for:', { coin, coinType, walletId });
    
    // First test if we can access the wallet
    const walletTestResponse = await fetch(`${BITGO_BASE_URL}/${coinType}/wallet/${walletId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BITGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Wallet access test:', {
      status: walletTestResponse.status,
      statusText: walletTestResponse.statusText,
      ok: walletTestResponse.ok
    });
    
    if (!walletTestResponse.ok) {
      const walletErrorText = await walletTestResponse.text();
      console.error('Wallet access failed:', walletErrorText);
      throw new Error(`Wallet access failed for ${coin}: ${walletTestResponse.status} - ${walletErrorText}`);
    }
    
    const walletInfo = await walletTestResponse.json();
    console.log('Wallet info:', { id: walletInfo.id, coin: walletInfo.coin, label: walletInfo.label });
    
    // Generate address (default)
    console.log('Creating address with:', {
      url: `${BITGO_BASE_URL}/${coinType}/wallet/${walletId}/address`,
      coinType,
      walletId,
      tradeId
    });
    
    const response = await fetch(`${BITGO_BASE_URL}/${coinType}/wallet/${walletId}/address`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BITGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        label: `escrow-${tradeId}-${Date.now()}`,
        // ETH doesn't use chain parameter
        ...(coinType === 'btc' ? { chain: 0 } : {})
      })
    });
    
    console.log('Address creation response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('BitGo API error details:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url: response.url,
        requestBody: { label: `escrow-${tradeId}` }
      });
      throw new Error(`BitGo API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('BitGo response:', data);
    
    // Store the real BitGo address in database
    const { error: insertError } = await supabase.from('escrow_addresses').insert({
      trade_id: tradeId,
      coin,
      address: data.address,
      wallet_id: walletId,
      status: 'pending',
      expected_amount: expectedAmount,
      created_at: new Date().toISOString()
    });
    
    if (insertError) {
      console.error('Database insert error:', insertError);
      // Continue anyway, address was created successfully
    }
    
    return new Response(JSON.stringify({ address: data.address }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});