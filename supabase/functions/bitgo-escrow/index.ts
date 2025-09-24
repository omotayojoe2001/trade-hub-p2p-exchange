import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BITGO_BASE_URL = 'https://app.bitgo-test.com/api/v2';
const BITGO_ACCESS_TOKEN = Deno.env.get('BITGO_ACCESS_TOKEN') || 'v2x534d125c94f2c8e142c81d56cf28064772b15b51f75772292ef610a860db53b6';
const BTC_WALLET_ID = Deno.env.get('BITGO_BTC_WALLET_ID') || '68c3107e4e3a88eabbaa707336d8245f';
const ETH_WALLET_ID = Deno.env.get('BITGO_ETH_WALLET_ID') || '68c3152aa55fc893636939a9eaf44484';

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
      const walletId = coin === 'BTC' ? BTC_WALLET_ID : ETH_WALLET_ID;
      const coinType = coin === 'BTC' ? 'tbtc' : 'hteth';
      
      console.log('Releasing funds:', { walletId, coinType, toAddress, amount });
      
      const response = await fetch(`${BITGO_BASE_URL}/${coinType}/wallet/${walletId}/sendcoins`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${BITGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address: toAddress,
          amount: amount.toString(),
          walletPassphrase: Deno.env.get('BITGO_WALLET_PASSPHRASE') || ''
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
    
    // Generate address (default)
    const walletId = coin === 'BTC' ? BTC_WALLET_ID : ETH_WALLET_ID;
    const coinType = coin === 'BTC' ? 'tbtc' : 'hteth';
    
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
        chain: coinType === 'tbtc' ? 0 : 1 // 0 for external chain, 1 for change chain
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