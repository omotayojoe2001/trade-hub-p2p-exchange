import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BITGO_BASE_URL = 'https://app.bitgo.com';
const BITGO_ACCESS_TOKEN = Deno.env.get('BITGO_ACCESS_TOKEN');
const BTC_WALLET_ID = Deno.env.get('BITGO_BTC_WALLET_ID');
const USDT_WALLET_ID = Deno.env.get('BITGO_USDT_WALLET_ID');

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
    const body = await req.json();
    const { tradeId, coin, expectedAmount } = body;
    
    if (!tradeId || !coin) {
      throw new Error('Missing required parameters');
    }
    
    const walletMap = { BTC: BTC_WALLET_ID, USDT: USDT_WALLET_ID };
    const coinTypeMap = { BTC: 'btc', USDT: 'sol' };
    const walletId = walletMap[coin];
    const coinType = coinTypeMap[coin];
    
    if (!walletId) {
      throw new Error(`Wallet not configured for ${coin}`);
    }
    
    let addressResponse;
    let isRealAddress = false;
    
    // Try real BitGo first
    if (BITGO_ACCESS_TOKEN) {
      console.log(`Attempting ${coin} address generation with BitGo...`);
      console.log(`Wallet ID: ${walletId?.substring(0, 8)}...`);
      console.log(`Coin type: ${coinType}`);
      
      try {
        const apiBody = {
          label: `escrow-${tradeId}-${Date.now()}`,
          ...(coinType === 'btc' ? { chain: 0 } : {}),
          ...(coinType === 'sol' && coin === 'USDT' ? { tokenName: 'usdt' } : {})
        };
        
        console.log(`API URL: ${BITGO_BASE_URL}/api/v2/${coinType}/wallet/${walletId}/address`);
        console.log(`Request body:`, apiBody);
        
        const response = await fetch(`${BITGO_BASE_URL}/api/v2/${coinType}/wallet/${walletId}/address`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${BITGO_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(apiBody),
          signal: AbortSignal.timeout(15000)
        });
        
        console.log(`BitGo response status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`BitGo success! Address: ${data.address}`);
          addressResponse = data.address;
          isRealAddress = true;
        } else {
          const errorText = await response.text();
          console.log(`BitGo error response:`, errorText);
          throw new Error(`API returned ${response.status}: ${errorText}`);
        }
      } catch (error) {
        console.log(`${coin} BitGo failed:`, error.message);
      }
    } else {
      console.log('No BITGO_ACCESS_TOKEN found');
    }
    
    // Fallback address if BitGo fails
    if (!addressResponse) {
      if (coin === 'BTC') {
        addressResponse = `bc1q${Math.random().toString(36).substring(2, 15)}${Date.now().toString().slice(-6)}`;
      } else {
        addressResponse = `${Math.random().toString(36).substring(2, 15)}USDT${Date.now().toString().slice(-6)}`;
      }
      isRealAddress = false;
    }
    
    // Store in database
    await supabase.from('escrow_addresses').insert({
      trade_id: tradeId,
      coin,
      address: addressResponse,
      wallet_id: walletId,
      status: isRealAddress ? 'pending' : 'fallback_active',
      expected_amount: expectedAmount,
      created_at: new Date().toISOString()
    });
    
    return new Response(JSON.stringify({ 
      address: addressResponse,
      isReal: isRealAddress
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});